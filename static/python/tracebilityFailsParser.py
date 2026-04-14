import re

class TracebilityFailsParser:
    def __init__(self):
        self.rules = [
            (r'^(SHO|FLOAT|LNK2TP)')
        ]

    def parse(self, text:str) -> list[str]:
        for name, pattern, formatterHandle in self.rules:
            match = re.search(pattern, text)
            if match:
                return formatterHandle(match)
            return 'UNKNOWN'
    
    def _getTestPoints(self, text:str) -> list[str]:
        # 'FLOAT (303)' -> ['303'] and 'SHO-HighRes-LowCap (298 256)' -> ['298', '256']
        testPointsInLastBracketPattern = r'\(([\d\s]+)\)'
        bracketGroup = re.search(testPointsInLastBracketPattern, text)
        if bracketGroup:
            return bracketGroup.group(1).split()
        
        # 'LNK2TP 3.6V 305-37' -> ['305', '37']
        testPointsHyphenPattern = r'\b(\d+)-(\d+)\s*$'
        hyphenGroup = re.search(testPointsHyphenPattern, text)
        if hyphenGroup:
            return list(hyphenGroup.groups())
        

    def _sanitizeToAlphaNumeric(self, text:str) -> str:
        sanitized = ''
        for char in text:
            char = char.upper() if char.isalnum() else ' '
            sanitized += char
        
        sanitized = sanitized.strip()
        sanitized = ' '.join(sanitized.split())
        return sanitized