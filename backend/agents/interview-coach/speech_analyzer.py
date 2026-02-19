import re
from typing import Dict, List

class SpeechAnalyzer:
    """Analyze speech for communication quality"""
    
    def __init__(self):
        self.filler_words = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally', 'just', 'kind of']
    
    def analyze_communication(self, transcript: str, duration_seconds: float = None) -> Dict:
        """Analyze communication quality from transcript"""
        
        if not transcript or not transcript.strip():
            return {
                'filler_word_count': 0,
                'words_per_minute': 0,
                'sentence_count': 0,
                'avg_sentence_length': 0,
                'incomplete_sentences': 0,
                'scores': {
                    'filler_score': 50,
                    'pace_score': 50,
                    'clarity_score': 50,
                    'overall_communication': 50
                }
            }
        
        # Clean and tokenize
        words = transcript.lower().split()
        word_count = len(words)
        
        # Count filler words
        filler_count = sum(1 for word in words if word in self.filler_words)
        
        # Calculate speaking rate (words per minute)
        wpm = 0
        if duration_seconds and duration_seconds > 0:
            wpm = (word_count / duration_seconds) * 60
        
        # Sentence analysis
        sentences = re.split(r'[.!?]+', transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_count = len(sentences) if sentences else 1
        avg_sentence_length = word_count / sentence_count
        
        # Grammar analysis (basic)
        incomplete_sentences = sum(1 for s in sentences if len(s.split()) < 3)
        
        # Calculate scores
        filler_ratio = filler_count / word_count if word_count > 0 else 0
        filler_score = max(0, 100 - (filler_ratio * 500))  # Penalize heavily
        
        pace_score = 100
        if wpm > 0:
            # Ideal: 120-160 WPM
            if 120 <= wpm <= 160:
                pace_score = 100
            elif wpm < 120:
                pace_score = max(0, 100 - ((120 - wpm) / 2))
            else:
                pace_score = max(0, 100 - ((wpm - 160) / 2))
        
        incomplete_ratio = incomplete_sentences / sentence_count if sentence_count > 0 else 0
        clarity_score = max(0, 100 - (incomplete_ratio * 200))
        
        overall_communication = (filler_score + pace_score + clarity_score) / 3
        
        return {
            'filler_word_count': filler_count,
            'words_per_minute': round(wpm, 1) if wpm > 0 else 0,
            'word_count': word_count,
            'sentence_count': sentence_count,
            'avg_sentence_length': round(avg_sentence_length, 1),
            'incomplete_sentences': incomplete_sentences,
            'scores': {
                'filler_score': round(filler_score, 1),
                'pace_score': round(pace_score, 1),
                'clarity_score': round(clarity_score, 1),
                'overall_communication': round(overall_communication, 1)
            },
            'feedback': self._generate_feedback(filler_count, wpm, clarity_score)
        }
    
    def _generate_feedback(self, filler_count: int, wpm: float, clarity_score: float) -> List[str]:
        """Generate feedback messages"""
        feedback = []
        
        if filler_count > 5:
            feedback.append("Try to reduce filler words like 'um', 'uh', 'like'")
        elif filler_count <= 2:
            feedback.append("Excellent control of filler words!")
        
        if wpm > 0:
            if wpm < 100:
                feedback.append("Consider speaking a bit faster to maintain engagement")
            elif wpm > 180:
                feedback.append("Slow down slightly to ensure clarity")
            else:
                feedback.append("Great speaking pace!")
        
        if clarity_score < 60:
            feedback.append("Work on sentence structure and completeness")
        elif clarity_score >= 80:
            feedback.append("Very clear and well-structured communication!")
        
        return feedback
