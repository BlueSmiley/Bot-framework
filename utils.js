const extractTranlsatedText = translatedResponse => translatedResponse[0].translations[0].text;
const extractDetectedLanguage = translatedResponse => translatedResponse[0].detectedLanguage.language;
const extractDetectedLanguageScore = translatedResponse => translatedResponse[0].detectedLanguage.score;

module.exports =
  {
      extractTranlsatedText,
      extractDetectedLanguage,
      extractDetectedLanguageScore
  };
