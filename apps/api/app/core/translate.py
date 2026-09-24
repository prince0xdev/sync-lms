import gettext
from app.core.get_translator import get_translator


def translate(locale: str, key: str, **values: str) -> str:
    message = get_translator(locale).gettext(key)
    return message.format(**values) if values else message
