# Goal
dramatically improve the quality of the experience through data quality and search algos

## Questions Improvements

Reverse engineer using Rands articles which specifically contrast personalities - how authentic and verbatim can we distill those into canonical questions?

These most authentic and high signal questions will receive a weighting/priority

For MVP create at least 3 of these highest priority questions

## Search Algorithm Improvements

For determining the next question, utilize A*

(could be pedantic and use BFS followed by UCS to systematically measure improvement?)

The heuristic is to get to a "terminal personality score", and to have "max value path" so highest weighted questions contribute first
