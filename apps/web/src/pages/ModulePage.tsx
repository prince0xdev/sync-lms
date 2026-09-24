import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import type { CourseDetail, ModuleContent, ModuleProgressResponse } from '../features/courses/types';

export default function ModulePage() {
    const { moduleId = '' } = useParams();
    const { locale, t } = useI18n();
    const { user, accessToken, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const lastSavedAt = useRef(0);
    const [audioLanguage, setAudioLanguage] = useState('');
    const moduleQuery = useQuery({
        queryKey: ['modules', 'detail', moduleId, locale],
        queryFn: () => apiRequest<ModuleContent>(`/modules/${moduleId}`, { locale, accessToken }),
        enabled: Boolean(user && moduleId),
    });
    const courseQuery = useQuery({
        queryKey: ['courses', 'detail', moduleQuery.data?.course_slug, locale, user?.id],
        queryFn: () => apiRequest<CourseDetail>(`/courses/${encodeURIComponent(moduleQuery.data?.course_slug ?? '')}`, { locale, accessToken }),
        enabled: Boolean(user && moduleQuery.data?.course_slug),
    });
    const progressMutation = useMutation({
        mutationFn: (progress: { progress_seconds: number; completed: boolean }) =>
            apiRequest<ModuleProgressResponse>(`/modules/${moduleId}/progress`, { method: 'PUT', body: progress, locale, accessToken }),
        onSuccess: (saved) => {
            queryClient.setQueryData<ModuleContent>(['modules', 'detail', moduleId, locale], (current) =>
                current ? { ...current, progress_seconds: saved.progress_seconds, completed: saved.completed } : current);
            void queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] });
        },
    });
    const availableTracks = moduleQuery.data?.audio_tracks ?? [];
    const savedLanguage = window.localStorage.getItem(`synclearn_audio_${moduleId}`) ?? '';
    const preferredLanguage = availableTracks.some((track) => track.language === audioLanguage)
        ? audioLanguage
        : availableTracks.find((track) => track.language === savedLanguage)?.language
            ?? availableTracks.find((track) => track.language === locale)?.language
            ?? availableTracks[0]?.language
            ?? '';
    const selectedTrack = availableTracks.find((track) => track.language === preferredLanguage);

    useEffect(() => {
        const module = moduleQuery.data;
        const video = videoRef.current;
        if (!module || !video) return;
        const restorePosition = () => { video.currentTime = Math.min(module.progress_seconds, Math.max(0, module.duration_seconds)); };
        video.addEventListener('loadedmetadata', restorePosition, { once: true });
        return () => video.removeEventListener('loadedmetadata', restorePosition);
    }, [moduleQuery.data?.id]);

    useEffect(() => {
        if (!selectedTrack || !audioRef.current) return;
        const audio = audioRef.current;
        const video = videoRef.current;
        const resumePlayback = () => {
            if (video) {
                audio.currentTime = video.currentTime;
                audio.playbackRate = video.playbackRate;
                if (!video.paused) void audio.play().catch(() => undefined);
            } else if (moduleQuery.data) {
                audio.currentTime = Math.min(moduleQuery.data.progress_seconds, audio.duration || moduleQuery.data.duration_seconds);
            }
        };
        audio.pause();
        audio.src = selectedTrack.url;
        audio.load();
        audio.addEventListener('loadedmetadata', resumePlayback, { once: true });
        return () => audio.removeEventListener('loadedmetadata', resumePlayback);
    }, [selectedTrack, moduleQuery.data?.id]);

    function currentTime() {
        return Math.floor(videoRef.current?.currentTime ?? audioRef.current?.currentTime ?? 0);
    }

    function saveProgress(completed = false, force = false) {
        const seconds = currentTime();
        if (!force && seconds - lastSavedAt.current < 10) return;
        lastSavedAt.current = seconds;
        progressMutation.mutate({ progress_seconds: seconds, completed });
    }

    function syncAudio() {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio || !selectedTrack) return;
        audio.currentTime = video.currentTime;
        audio.playbackRate = video.playbackRate;
        void audio.play().catch(() => undefined);
    }

    if (authLoading) return <p role="status">{t('loading')}</p>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;
    if (moduleQuery.isPending) return <p role="status">{t('loading_module')}</p>;
    if (moduleQuery.isError) return <p role="alert">{moduleQuery.error.message}</p>;
    const module = moduleQuery.data;
    const modules = [...(courseQuery.data?.modules ?? [])].sort((a, b) => a.position - b.position);
    const currentIndex = modules.findIndex((item) => item.id === module.id);
    const nextModule = currentIndex >= 0 ? modules[currentIndex + 1] : undefined;
    const progressPercent = module.duration_seconds > 0 ? Math.min(100, Math.round(module.progress_seconds * 100 / module.duration_seconds)) : 0;

    return (
        <main className="course-detail">
            <Link to={`/${locale}/courses/${module.course_slug}`}>{t('back_to_course')}</Link>
            <p className="course-meta">{t('module_number')} {module.position}</p>
            <h1>{module.title}</h1>
            <p>{module.description}</p>
            {module.video_url ? <div className="player-frame">
                <video ref={videoRef} controls playsInline muted={module.audio_tracks.length > 0} src={module.video_url}
                    onPlay={syncAudio} onPause={() => { audioRef.current?.pause(); saveProgress(false, true); }}
                    onTimeUpdate={() => saveProgress()} onSeeking={() => { if (audioRef.current && videoRef.current) audioRef.current.currentTime = videoRef.current.currentTime; }}
                    onRateChange={() => { if (audioRef.current && videoRef.current) audioRef.current.playbackRate = videoRef.current.playbackRate; }}
                    onEnded={() => { audioRef.current?.pause(); saveProgress(true, true); }} />
                {module.audio_tracks.length > 0 && <label className="audio-choice">{t('audio_language')}
                    <select value={preferredLanguage} onChange={(event) => {
                        setAudioLanguage(event.target.value);
                        window.localStorage.setItem(`synclearn_audio_${moduleId}`, event.target.value);
                    }}>{module.audio_tracks.map((track) => <option key={track.language} value={track.language}>{track.language.toUpperCase()}</option>)}</select>
                </label>}
                <audio ref={audioRef} preload="metadata" />
            </div> : <div className="media-unavailable">
                {module.audio_tracks.length > 0 && selectedTrack ? <audio ref={audioRef} controls src={selectedTrack.url} onTimeUpdate={() => saveProgress()} onPause={() => saveProgress(false, true)} onEnded={() => saveProgress(true, true)} /> : <p>{t('video_unavailable')}</p>}
                {module.audio_tracks.length > 0 && <label className="audio-choice">{t('audio_language')}
                    <select value={preferredLanguage} onChange={(event) => {
                        setAudioLanguage(event.target.value);
                        window.localStorage.setItem(`synclearn_audio_${moduleId}`, event.target.value);
                    }}>{module.audio_tracks.map((track) => <option key={track.language} value={track.language}>{track.language.toUpperCase()}</option>)}</select>
                </label>}
            </div>}
            <div className="player-actions">
                <span>{module.completed ? t('module_completed') : `${progressPercent}%`}</span>
                <button type="button" onClick={() => saveProgress(true, true)} disabled={module.completed || progressMutation.isPending}>{module.completed ? t('module_completed') : t('mark_complete')}</button>
                {nextModule && <Link className="course-link" to={`/${locale}/courses/${module.course_slug}/modules/${nextModule.id}`} onClick={() => saveProgress(module.completed, true)}>{t('next_module')}: {nextModule.title}</Link>}
            </div>
            {progressMutation.isError && <p role="alert">{progressMutation.error.message}</p>}
        </main>
    );
}
