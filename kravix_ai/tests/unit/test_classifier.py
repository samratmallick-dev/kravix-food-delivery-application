from app.nlp.classifier import classifier
from app.models.schemas import Intent

def test_classifier_exact_match():
    intent, conf = classifier.classify("where is my order")
    assert intent == Intent.ORDER_TRACKING
    assert conf > 0.9

def test_classifier_fuzzy_typo():
    intent, conf = classifier.classify("cance my order")
    assert intent == Intent.ORDER_CANCELLATION
    assert conf >= 0.75

def test_classifier_greedy_collision_prevented():
    intent, conf = classifier.classify("track my earning")
    assert intent == Intent.RIDER_EARNINGS

def test_classifier_unknown():
    intent, conf = classifier.classify("what is the capital of france")
    assert intent == Intent.UNKNOWN
