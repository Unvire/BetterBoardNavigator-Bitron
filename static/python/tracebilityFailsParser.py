import re

class TracebilityFailsParser:
    def __init__(self):
        self.rules = [
        ]

    def parse(self, text:str) -> list[str]:
        for name, pattern, formatterHandle in self.rules:
            match = re.search(pattern, text)
            if match:
                return formatterHandle(match)
            return 'UNKNOWN'