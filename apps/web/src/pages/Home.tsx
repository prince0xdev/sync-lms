import Header from '../components/Header';
import Hero from '../components/Hero';
import CourseCard from '../components/CourseCard';

export default function Home() {
    return (
        <div>
            <Header />
            <main>
                <Hero />
                <section style={{ marginTop: 32 }}>
                    <h2 style={{ marginBottom: 16 }}>Featured Engineering Tracks</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                        <CourseCard title="Data Engineering Fundamentals" subtitle="Apache Spark · Beginner" />
                        <CourseCard title="Full-Stack Systems & APIs" subtitle="Backend · Intermediate" />
                        <CourseCard title="Cloud Architecture & Kubernetes" subtitle="Advanced" />
                    </div>
                </section>
            </main>
        </div>
    );
}
