import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Select } from '@umami/react-zen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import type { CourseDetail, ModuleContent, ModuleProgressResponse } from '../features/courses/types';
import languageOptions from '../features/courses/language-options';

export default function ModulePage() {
    const { moduleId = '' } = useParams();
    const { locale, t } = useI18n();
    const { user, accessToken, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastSavedAt = useRef(0);
    const pendingVideoPosition = useRef<{ time: number; playing: boolean } | null>(null);
    const [audioLanguage, setAudioLanguage] = useState('');
    const [videoLanguage, setVideoLanguage] = useState('');
    const moduleQuery = useQuery({ queryKey: ['modules', 'detail', moduleId, locale], queryFn: () => apiRequest<ModuleContent>(`/modules/${moduleId}`, { locale, accessToken }), enabled: Boolean(user && moduleId) });
    const courseQuery = useQuery({ queryKey: ['courses', 'detail', moduleQuery.data?.course_slug, locale, user?.id], queryFn: () => apiRequest<CourseDetail>(`/courses/${encodeURIComponent(moduleQuery.data?.course_slug ?? '')}`, { locale, accessToken }), enabled: Boolean(user && moduleQuery.data?.course_slug) });
    const progressMutation = useMutation({
        mutationFn: (progress: { progress_seconds: number; completed: boolean }) => apiRequest<ModuleProgressResponse>(`/modules/${moduleId}/progress`, { method: 'PUT', body: progress, locale, accessToken }),
        onSuccess: (saved) => { queryClient.setQueryData<ModuleContent>(['modules', 'detail', moduleId, locale], (current) => current ? { ...current, progress_seconds: saved.progress_seconds, completed: saved.completed } : current); void queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] }); },
    });
    const module = moduleQuery.data;
    const audioTracks = module?.audio_tracks ?? [];
    const videoTracks = module?.video_tracks ?? [];
    const savedAudioLanguage = window.localStorage.getItem(`synclearn_audio_${moduleId}`) ?? '';
    const savedVideoLanguage = window.localStorage.getItem(`synclearn_video_${moduleId}`) ?? '';
    const selectedAudioLanguage = audioTracks.some((track) => track.language === audioLanguage) ? audioLanguage : audioTracks.find((track) => track.language === savedAudioLanguage)?.language ?? audioTracks.find((track) => track.language === locale)?.language ?? audioTracks[0]?.language ?? '';
    const selectedVideoLanguage = videoTracks.some((track) => track.language === videoLanguage) ? videoLanguage : videoTracks.find((track) => track.language === savedVideoLanguage)?.language ?? videoTracks.find((track) => track.language === locale)?.language ?? videoTracks.find((track) => track.language === courseQuery.data?.language)?.language ?? videoTracks[0]?.language ?? '';
    const selectedAudioTrack = audioTracks.find((track) => track.language === selectedAudioLanguage);
    const selectedVideoTrack = videoTracks.find((track) => track.language === selectedVideoLanguage);
    const videoUrl = selectedVideoTrack?.url ?? module?.video_url ?? null;

    useEffect(() => {
        const video = videoRef.current;
        if (!module || !video) return;
        const restorePosition = () => { video.currentTime = Math.min(module.progress_seconds, Math.max(0, module.duration_seconds)); };
        video.addEventListener('loadedmetadata', restorePosition, { once: true });
        return () => video.removeEventListener('loadedmetadata', restorePosition);
    }, [module?.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !selectedVideoTrack) return;
        const playback = pendingVideoPosition.current;
        if (!playback) return;
        const restoreTrack = () => { video.currentTime = playback.time; if (playback.playing) void video.play().catch(() => undefined); pendingVideoPosition.current = null; };
        video.addEventListener('loadedmetadata', restoreTrack, { once: true });
        return () => video.removeEventListener('loadedmetadata', restoreTrack);
    }, [selectedVideoTrack?.url]);

    useEffect(() => {
        if (!selectedAudioTrack || !audioRef.current) return;
        const audio = audioRef.current;
        const video = videoRef.current;
        const resumePlayback = () => {
            if (video) { audio.currentTime = video.currentTime; audio.playbackRate = video.playbackRate; if (!video.paused) void audio.play().catch(() => undefined); }
            else if (module) audio.currentTime = Math.min(module.progress_seconds, audio.duration || module.duration_seconds);
        };
        audio.pause(); audio.src = selectedAudioTrack.url; audio.load(); audio.addEventListener('loadedmetadata', resumePlayback, { once: true });
        return () => audio.removeEventListener('loadedmetadata', resumePlayback);
    }, [selectedAudioTrack?.url, module?.id]);

    if (authLoading) return <p role="status">{t('loading')}</p>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;
    if (moduleQuery.isPending) return <p role="status">{t('loading_module')}</p>;
    if (moduleQuery.isError || !module) return <p role="alert">{moduleQuery.error?.message ?? 'Module unavailable'}</p>;
    const modules = [...(courseQuery.data?.modules ?? [])].sort((a, b) => a.position - b.position);
    const currentIndex = modules.findIndex((item) => item.id === module.id);
    const nextModule = currentIndex >= 0 ? modules[currentIndex + 1] : undefined;
    const progressPercent = module.duration_seconds > 0 ? Math.min(100, Math.round(module.progress_seconds * 100 / module.duration_seconds)) : 0;

    return <main className="staff-shell learner-shell">
        <div className="staff-content learner-content">
            <Link className="learner-back" to={`/${locale}/courses/${module.course_slug}`}>{t('back_to_course')}</Link>
            <section className="staff-page-heading learner-module-heading"><div><p className="staff-eyebrow">{t('module_number', { number: module.position })}</p><h1>{module.title}</h1><p>{module.description}</p></div><Badge className="staff-level">{module.completed ? t('module_completed') : `${progressPercent}%`}</Badge></section>
            {videoUrl ? <div className="player-frame learner-player-frame">
                <video key={videoUrl} ref={videoRef} controls playsInline muted={audioTracks.length > 0} src={videoUrl}
                    onPlay={() => { if (selectedAudioTrack && audioRef.current && videoRef.current) { audioRef.current.currentTime = videoRef.current.currentTime; audioRef.current.playbackRate = videoRef.current.playbackRate; void audioRef.current.play().catch(() => undefined); } }}
                    onPause={() => { audioRef.current?.pause(); if (videoRef.current) progressMutation.mutate({ progress_seconds: Math.floor(videoRef.current.currentTime), completed: false }); }}
                    onTimeUpdate={() => { const seconds = Math.floor(videoRef.current?.currentTime ?? 0); if (seconds - lastSavedAt.current >= 10) { lastSavedAt.current = seconds; progressMutation.mutate({ progress_seconds: seconds, completed: false }); } }}
                    onSeeking={() => { if (audioRef.current && videoRef.current) audioRef.current.currentTime = videoRef.current.currentTime; }}
                    onRateChange={() => { if (audioRef.current && videoRef.current) audioRef.current.playbackRate = videoRef.current.playbackRate; }}
                    onEnded={() => { audioRef.current?.pause(); progressMutation.mutate({ progress_seconds: Math.floor(videoRef.current?.currentTime ?? module.duration_seconds), completed: true }); }} />
                <div className="learner-media-options">
                    {videoTracks.length > 1 && <label>{t('ui_video_language_langue_de_la_video')}<Select value={selectedVideoLanguage} items={languageOptions(videoTracks.map((track) => track.language))} onChange={(value) => { if (typeof value === 'string' && videoRef.current) { pendingVideoPosition.current = { time: videoRef.current.currentTime, playing: !videoRef.current.paused }; window.localStorage.setItem(`synclearn_video_${moduleId}`, value); setVideoLanguage(value); } }} /></label>}
                    {audioTracks.length > 0 && <label>{t('audio_language')}<Select value={selectedAudioLanguage} items={languageOptions(audioTracks.map((track) => track.language))} onChange={(value) => { if (typeof value === 'string') { window.localStorage.setItem(`synclearn_audio_${moduleId}`, value); setAudioLanguage(value); } }} /></label>}
                </div>
                {audioTracks.length > 0 && <audio ref={audioRef} preload="metadata" />}
            </div> : <div className="media-unavailable learner-panel"><p>{t('video_unavailable')}</p>{videoTracks.length > 1 && <label>{t('ui_video_language_langue_de_la_video')}<Select value={selectedVideoLanguage} items={languageOptions(videoTracks.map((track) => track.language))} onChange={(value) => { if (typeof value === 'string') { window.localStorage.setItem(`synclearn_video_${moduleId}`, value); setVideoLanguage(value); } }} /></label>}</div>}
            <section className="staff-panel learner-module-actions"><div><p className="staff-eyebrow">{t('ui_your_progress_votre_progression')}</p><ProgressBar className="staff-progress-component" value={progressPercent} max={100} aria-label={`${progressPercent}%`} /></div><Button variant="primary" className="staff-primary" onClick={() => progressMutation.mutate({ progress_seconds: module.duration_seconds, completed: true })} isDisabled={module.completed || progressMutation.isPending}>{module.completed ? t('module_completed') : t('mark_complete')}</Button>{nextModule && <Link className="course-link" to={`/${locale}/courses/${module.course_slug}/modules/${nextModule.id}`} onClick={() => progressMutation.mutate({ progress_seconds: Math.floor(videoRef.current?.currentTime ?? 0), completed: module.completed })}>{t('next_module')}: {nextModule.title}</Link>}</section>
            {progressMutation.isError && <p role="alert" className="staff-alert">{progressMutation.error.message}</p>}
        </div>
    </main>;
}
