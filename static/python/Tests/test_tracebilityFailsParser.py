import pytest
from tracebilityFailsParser import TracebilityFailsParser

@pytest.fixture
def parser():
    return TracebilityFailsParser()

@pytest.mark.parametrize("input_text, expected_output", [
    ("FLOAT (303)", ["303"]),
    ("SHO-HighRes-LowCap (298 256)", ["298", "256"]),
    ("LNK2TP 3.6V 305-37", ["305", "37"]),
    ("LNK2TP +12V 325-341", ["325", "341"]),
    ("OPENSW1-1 (TP 3-50)", ["SW1"]),
    ("OPENJ6 (TP 193-197) Do Not Mount!", ["J6"]),
    ("RESR122 150K 1%", ["R122"]),
    ("LNKR16 182-183", ["R16"]),
    ("RESRB1-1-8 10K 5%", ["RB1"]),
    ("RES R142/R143 50 1%", ["R142", "R143"]),
    ("RESNTC1 4.7 20%", ["NTC1"]),
    ("LNK R169 + RESR154 220K 5%", ["R169", "R154"]),
    ("RES TR42-RBE/TR48-RBE 25.85K 30%", ["TR22", "TR48"]),
    ("RESR270 // R275+C151 6.96K 10%", ["R270", "R275", "C151"]),
    ("CAPC144 100n 10% -10%", ["C144"]),
    ("CAP C161/C165 13.6n 10% -10%", ["C161", "C165"]),
    ("CAP C175/C193/C201/C202/C226/C227/C228/C187/C192/C176/ 72.1001uF 11% -11%", ["C175", "C193", "C201", "C202", "C226", "C227", "C228", "C187", "C192", "C176"]),
    ("CAP EC1/C45/C63/C69/C97/C145/C154/C146/C147/C152/C153/ 89.8uF 15% -15%", ["EC1", "C45", "C63", "C69", "C97", "C145", "C154", "C146", "C147", "C152", "C153"]),
    ("CAPC2\\C46\\C47\\C4\\C5\\C6\\C42\\C23\\C24\\C25\\C26\\C27\\C28\\C29\\C17\\C10\\C11\\C21\\C13\\C14\\C18 320.22UF +20% -20%", ["C2", "C46", "C47", "C4", "C5", "C6", 
        "C42", "C23", "C24", "C25", "C26", "C27", "C28", "C29", "C17", "C10", "C11", "C21", "C13", "C14", "C18"]),  
    ("DSC-C30", ["C30"]),
    ("DSC-CP[C58]", ["C58"]),
    ("CAP.EC2 Reversed!", ["EC2"]),
    ("JSCAN U10-23", ["U10"]),
    ("CAPC26+C28 69pF 5% -5%", ["C26", "C28"]),
    ("INDL1 10u 10% -10%", ["L1"]),
    ("TRNQ1 BC847B", ["Q1"]),
    ("TRPQ37 BC857B", ["Q37"]),
    ("MOSQ8 2N7002ET1G", ["Q8"]),
    ("TRNTR1 BC847B", ["TR1"]),
    ("DIOD1-D1 !BAV170_D", ["D1"]),
    ("ZENZ1 GWMMSZ5232B", ["Z1"]),
    ("TVS D11", ["D11"]),
    ("TVS DD2-Z2 !CDSOT23-SM712", ["DD2"]),
    ("LEDLD2 LHRF12243/F139/A", ["LD2"]),
    ("VDR1 PRESENT?", ["VDR1"]),
    ("RELAY RL1 HF170F12-2H1DTF", ["RL1"]),
    ("OPTC OC3 K10104A", ["OC3"]),
    ("TRCTY1 BTP16-700BWRG", ["TY1"]),
    ("T1 5-7 Presence test", ["T1"]),
    ("TRFVT1-1", ["VT1"]),
    ("D13-01 ", ["D13"]),
    ("C303", ["C303"]),
    ("UNKNOWN FORMAT 123", ["UNKNOWN"])
])
def test_component_parsing(parser, input_text, expected_output):
    """Testuje, czy parser poprawnie wyciąga identyfikatory z różnych formatów."""
    assert parser.parse(input_text) == expected_output