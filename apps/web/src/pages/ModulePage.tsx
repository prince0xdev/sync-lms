import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';
import type { ModuleContent } from '../features/courses/types';

export default function ModulePage() {
    const { moduleId = '' } = useParams();
    const { locale, t } = useI18n();
    const { user, accessToken, isLoading: authLoading } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioLanguage, setAudioLanguage] = useState('');
    const moduleQuery = useQuery({
        queryKey: ['modules', 'detail', moduleId, locale],
        queryFn: () => apiRequest<ModuleContent>(`/modules/${moduleId}`, { locale, accessToken }),
        enabled: Boolean(user && moduleId),
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
        if (!selectedTrack || !audioRef.current) return;
        const audio = audioRef.current;
        const video = videoRef.current;
        const resumePlayback = () => {
            if (!video) return;
            audio.currentTime = video.currentTime;
            audio.playbackRate = video.playbackRate;
            if (!video.paused) void audio.play().catch(() => undefined);
        };
        audio.pause();
        audio.src = selectedTrack.url;
        audio.load();
        audio.addEventListener('loadedmetadata', resumePlayback, { once: true });
        return () => audio.removeEventListener('loadedmetadata', resumePlayback);
    }, [selectedTrack]);

    if (authLoading) return <p role="status">{t('loading')}</p>;
    if (!user) return <Navigate to={`/${locale}/login`} replace />;
    if (moduleQuery.isPending) return <p role="status">{t('loading_module')}</p>;
    if (moduleQuery.isError) return <p role="alert">{moduleQuery.error.message}</p>;
    const module = moduleQuery.data;

    function syncAudio() {
        const video = videoRef.current;
        const audio = audioRef.current;
        if (!video || !audio || !selectedTrack) return;
        audio.currentTime = video.currentTime;
        audio.playbackRate = video.playbackRate;
        void audio.play().catch(() => undefined);
    }

    return (
        <main className="course-detail">
            <Link to={`/${locale}/courses/${module.course_slug}`}>{t('back_to_course')}</Link>
            <p className="course-meta">{t('module_number')} {module.position}</p>
            <h1>{module.title}</h1>
            <p>{module.description}</p>
            {module.video_url ? <div className="player-frame">
                <video
                    ref={videoRef}
                    controls
                    playsInline
                    muted={module.audio_tracks.length > 0}
                    src={module.video_url}
                    onPlay={syncAudio}
                    onPause={() => audioRef.current?.pause()}
                    onSeeking={() => { if (audioRef.current && videoRef.current) audioRef.current.currentTime = videoRef.current.currentTime; }}
                    onRateChange={() => { if (audioRef.current && videoRef.current) audioRef.current.playbackRate = videoRef.current.playbackRate; }}
                    onEnded={() => audioRef.current?.pause()}
                />
                {module.audio_tracks.length > 0 && <label className="audio-choice">
                    {t('audio_language')}
                    <select value={preferredLanguage} onChange={(event) => {
                        setAudioLanguage(event.target.value);
                        window.localStorage.setItem(`synclearn_audio_${moduleId}`, event.target.value);
                    }}>
                        {module.audio_tracks.map((track) => <option key={track.language} value={track.language}>{track.language.toUpperCase()}</option>)}
                    </select>
                </label>}
                <audio ref={audioRef} preload="metadata" />
            </div> : <div className="media-unavailable">
                {module.audio_tracks.length > 0 && selectedTrack
                    ? <audio controls src={selectedTrack.url} />
                    : <p>{t('video_unavailable')}</p>}
                {module.audio_tracks.length > 0 && <>
                    <label className="audio-choice">{t('audio_language')}
                        <select value={preferredLanguage} onChange={(event) => {
                            setAudioLanguage(event.target.value);
                            window.localStorage.setItem(`synclearn_audio_${moduleId}`, event.target.value);
                        }}>
                            {module.audio_tracks.map((track) => <option key={track.language} value={track.language}>{track.language.toUpperCase()}</option>)}
                        </select>
                    </label>
                    <p>{t('audio_tracks_available')}: {module.audio_tracks.map((track) => track.language.toUpperCase()).join(' · ')}</p>
                </>}
            </div>}
        </main>
    );
}
