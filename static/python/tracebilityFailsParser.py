import re

class TracebilityFailsParser:
    def __init__(self):
        self.rules = [
            ("^(SHO|FLOAT)")
        ]

    def parse(self, text:str) -> list[str]:
        for name, pattern, formatterHandle in self.rules:
            match = re.search(pattern, text)
            if match:
                return formatterHandle(match)
            return 'UNKNOWN'
    
    def _sanitize(self, text:str) -> str:
        sanitized = ''
        for char in text:
            char = char.upper() if char.isalnum() else ' '
            sanitized += char
        
        sanitized = sanitized.strip()
        sanitized = " ".join(sanitized.split())
        return sanitized