import os

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.course import Course
from app.models.module import Module

DEMO_COURSES = [
    {
        "title": "Les bases de l’ingénierie des données",
        "slug": "ingenierie-des-donnees",
        "description": "Découvrez les principes des pipelines de données et du traitement distribué.",
        "instructor": "Amélie Martin",
        "language": "fr",
        "level": "beginner",
        "modules": ["Comprendre les pipelines", "Premiers pas avec Spark"],
    },
    {
        "title": "Construire des API avec FastAPI",
        "slug": "api-avec-fastapi",
        "description": "Concevez une API typée, documentée et prête à évoluer.",
        "instructor": "Thomas Bernard",
        "language": "fr",
        "level": "intermediate",
        "modules": ["Routes et schémas", "Connexion à PostgreSQL"],
    },
    {
        "title": "Cloud architecture fundamentals",
        "slug": "cloud-architecture",
        "description": "Learn the building blocks of reliable cloud applications.",
        "instructor": "Jordan Lee",
        "language": "en",
        "level": "beginner",
        "modules": ["Cloud foundations", "Designing for resilience"],
    },
]


def seed_demo_courses() -> None:
    if os.getenv("SEED_DEMO_DATA", "false").lower() not in {"1", "true", "yes"}:
        return
    with SessionLocal() as db:
        for data in DEMO_COURSES:
            course = db.scalar(select(Course).where(Course.slug == data["slug"]))
            if course is not None:
                continue
            course_data = {key: value for key, value in data.items() if key != "modules"}
            module_titles = data["modules"]
            course = Course(**course_data)
            course.modules = [
                Module(title=title, position=position, duration_seconds=480)
                for position, title in enumerate(module_titles, start=1)
            ]
            db.add(course)
        db.commit()


if __name__ == "__main__":
    seed_demo_courses()
