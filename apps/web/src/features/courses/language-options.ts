export type LanguageOption = { value: string; label: string };

export default function languageOptions(languages: string[]): LanguageOption[] {
    return languages.map((language) => ({ value: language, label: language.toUpperCase() }));
}
