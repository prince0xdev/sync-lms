import gettext
from functools import lru_cache
from pathlib import Path

SUPPORTED_LOCALES = {"fr", "en"}
LOCALES_DIRECTORY = Path(__file__).resolve().parents[1] / "locales"


@lru_cache(maxsize=2)
def get_translator(locale: str) -> gettext.NullTranslations:
    language = locale if locale in SUPPORTED_LOCALES else "en"
    return gettext.translation("messages", localedir=LOCALES_DIRECTORY, languages=[language], fallback=True)
