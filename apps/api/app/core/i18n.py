from fastapi import Request

SUPPORTED_LOCALES = {"fr", "en"}
MESSAGES = {
    "fr": {
        "email_registered": "Cette adresse e-mail est déjà utilisée.",
        "invalid_credentials": "Adresse e-mail ou mot de passe incorrect.",
        "invalid_session": "La session a expiré ou n’est plus valide.",
        "unauthorized": "Authentification requise.",
        "registered": "Compte créé.",
        "logged_in": "Connexion réussie.",
        "logged_out": "Déconnexion réussie.",
        "session_refreshed": "Session renouvelée.",
        "validation_error": "Les informations envoyées sont invalides.",
        "invalid_field": "Valeur invalide.",
    },
    "en": {
        "email_registered": "This email address is already in use.",
        "invalid_credentials": "The email address or password is incorrect.",
        "invalid_session": "The session has expired or is no longer valid.",
        "unauthorized": "Authentication is required.",
        "registered": "Account created.",
        "logged_in": "Login successful.",
        "logged_out": "Logout successful.",
        "session_refreshed": "Session renewed.",
        "validation_error": "The submitted information is invalid.",
        "invalid_field": "Invalid value.",
    },
}


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

def translate(locale: str, key: str) -> str:
    return MESSAGES.get(locale, MESSAGES["en"]).get(key, MESSAGES["en"].get(key, key))
