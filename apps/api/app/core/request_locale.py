from fastapi import Request

SUPPORTED_LOCALES = {"fr", "en"}


def get_locale(request: Request) -> str:
    priorities: list[tuple[float, int, str]] = []
    for position, part in enumerate(request.headers.get("accept-language", "").split(",")):
        values = [value.strip() for value in part.split(";")]
        language = values[0].lower().split("-", 1)[0]
        if language not in SUPPORTED_LOCALES:
            continue
        quality = 1.0
        for value in values[1:]:
            if value.startswith("q="):
                try:
                    quality = float(value[2:])
                except ValueError:
                    quality = 0.0
        if quality > 0:
            priorities.append((-quality, position, language))
    priorities.sort()
    return priorities[0][2] if priorities else "en"
