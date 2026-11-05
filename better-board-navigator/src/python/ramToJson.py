import json
import geometryObjects as gobj
import component as comp
import pin
import board
from boardWrapper import BoardWrapper


class BoardEncoder(json.JSONEncoder):
    def default(self, obj):
        # --- Geometria ---
        if isinstance(obj, gobj.Point):
            return {"x": obj.x, "y": obj.y}
        
        elif isinstance(obj, gobj.Line):
            return {
                "type": "Line", 
                "start": self.default(obj.startPoint), 
                "end": self.default(obj.endPoint)
            }
        
        elif isinstance(obj, gobj.Arc):
            center, radius, start_angle, end_angle = obj.getAsCenterRadiusAngles()
            return {
                "type": "Arc",
                "center": self.default(center),
                "radius": radius,
                "startAngle": start_angle,
                "endAngle": end_angle
            }
        
        elif isinstance(obj, gobj.Circle):
            return {
                "type": "Circle",
                "center": self.default(obj.centerPoint),
                "radius": obj.radius
            }
        
        elif isinstance(obj, gobj.Rectangle):
            return {
                "type": "Rectangle",
                "points": [self.default(p) for p in obj.getPoints()]
            }
        
        # --- Struktura Płytki ---
        elif isinstance(obj, pin.Pin):
            return {
                "name": obj.name,
                "net": obj.net,
                "shapeType": obj.shape, # 'RECT' lub 'CIRCLE'
                "shapeData": self.default(obj.shapeData),
                "coords": self.default(obj.coords) if obj.coords else None
            }
            
        elif isinstance(obj, comp.Component):
            return {
                "name": obj.name,
                "side": obj.side,
                "angle": obj.angle,
                "mountingType": obj.mountingType,
                "shapeType": obj.shape,
                "shapeData": self.default(obj.shapeData),
                "coords": self.default(obj.coords) if obj.coords else None,
                "pins": obj.pins # JSONEncoder sam przetworzy ten słownik
            }
            
        elif isinstance(obj, board.Board):
            # Upraszczamy słownik nets, żeby nie duplikować obiektów komponentów
            simplified_nets = {}
            for net_name, comp_dict in obj.nets.items():
                simplified_nets[net_name] = {
                    comp_name: {"pins": data["pins"]} 
                    for comp_name, data in comp_dict.items()
                }

            return {
                "boardDimensions": obj.getWidthHeight(),
                "area": [self.default(p) for p in obj.getArea()],
                "outlines": [self.default(shape) for shape in obj.outlines],
                "components": obj.components,
                "nets": simplified_nets,
                "mostCommonPrefix": obj.mostCommonPrefix
            }

        # Na wypadek gdybyś używał zbiorów (set)
        elif isinstance(obj, set):
            return list(obj)
            
        # Zabezpieczenie (fallback)
        return super().default(obj)



def dump_board_to_json():
    # 1. Tu korzystamy z Twojego okienka do wyboru pliku
    from tkinter import filedialog
    filePath = filedialog.askopenfile(mode='r', filetypes=[('*', '*')]).name
    
    # 2. Ładujemy i normalizujemy płytkę (Twoja standardowa logika z RAM)
    wrapper = BoardWrapper(1200, 700)
    wrapper.loadAndSetBoardFromFilePath(filePath)
    normalizedBoard = wrapper.normalizeBoard()
    
    # 3. Zrzucamy RAM do JSON (Magia!)
    output_filename = "mockBoard.json"
    print("Trwa zrzucanie pamięci do pliku JSON...")
    
    with open(output_filename, "w", encoding="utf-8") as json_file:
        # Przekazujemy naszą instancję Board oraz klasę enkodera
        json.dump(normalizedBoard, json_file, cls=BoardEncoder, indent=2)
        
    print(f"Gotowe! Plik zapisany jako {output_filename}")

if __name__ == '__main__':
    dump_board_to_json()