import pygame, math, copy, re, itertools
import pin, board
from boardWrapper import BoardWrapper
import geometryObjects as gobj
from abstractShape import Shape
import component as comp

class DrawBoardEngine:
    CHUNK_SIZE_PX = 512
    BONUS_SCALE_FACTOR = 1.05
    SCALE_BASE = 1.23
    STEP_MAX = 10
    STEP_MIN = -5
    DELTA_ROTATION_ANGLE_DEG = 5
    MIN_FONT_SIZE = 10
    MAX_FONT_SIZE = 26

    def __init__(self, width:int, height:int):
        pygame.font.init()

        self.boardData = None
        self.boardDataBackup = None
        self.drawHandler = {
            'Line': self._drawLine,
            'Arc': self._drawArc
        }
        
        self.colorsDict = {           
            'background': (0, 0, 0), 
            'outlines': (255, 255, 255),
            'components': (8, 212, 15),
            'TH pins': (21, 103, 235),
            'SMT pins': (240, 187, 12),
            'selected component marker': (255, 0, 0),
            'selected net marker': (171, 24, 149),
            'selection rectangle': (158, 158, 158)
        }
        
        self.surfaceDimensions = [self.CHUNK_SIZE_PX, self.CHUNK_SIZE_PX]
        self.boardBaseRectangle = None
        self.screenDimensions = [width, height]

        self.boardLayer = None
        self.commonTypeComponentsSurface = None
        self.selectedComponentsSurface = None
        self.selectedNetSurface = None
        self.fontSurface = None

        self.selectedComponentsSet = set()
        self.allSelectedNetComponentsSet = set()
        self.selectedNetComponentSet = set()
        self.selectedCommonTypePrefix = ''
        self.selectedNet = dict()

        self.fontCache = {}

        self.areaCache = {}
        self.surfaceChunks = {}

        self.scaleStep = 0
        self.offsetVector = []
        self.sidesForFlipX = {}
        self.isShowOutlines = True
        self.isShowComponentNames = False

    def getComponents(self) -> list[str]:
        componentsList = list(self.boardData.getComponents().keys())
        return sorted(componentsList, key=self._componentStringValue)
    
    def getNets(self) -> dict:
        nets = {}
        for netName, componentOnNetSubDict in self.boardData.getNets().items():
            nets[netName] = {}
            componentsOnNetDict = {}
            for componentName in componentOnNetSubDict:
                pinsList = sorted(componentOnNetSubDict[componentName]['pins'], key=self._pinStringValue)
                pinsString = ', '.join(pinsList)
                componentsOnNetDict[componentName] = pinsString
            nets[netName] = dict(sorted(componentsOnNetDict.items(), key=lambda componentPinoutData: self._componentStringValue(componentPinoutData[0])))

        sortedNetNamesList = sorted(nets.keys()) 
        return {netName:nets[netName] for netName in sortedNetNamesList}
    
    def getSideOfComponent(self, componentName:str) -> str:
        componentInstance = self.boardData.getElementByName('components', componentName)
        return componentInstance.getSide() if componentInstance else ''
    
    def getComponentPinout(self, componentName:str) -> dict:
        componentInstance = self.boardData.getElementByName('components', componentName)
        pins = componentInstance.getPins()
        pinoutDict = {pinName:pinInstance.getNet() for pinName, pinInstance in pins.items()}
        return dict(sorted(pinoutDict.items(), key=lambda pinData: self._pinStringValue(pinData[0])))
        
    def getSelectedComponents(self) -> list[str]:
        return list(self.selectedComponentsSet)
    
    def getSelectedNetComponent(self) -> str:
        if self.selectedNetComponentSet:
            return list(self.selectedNetComponentSet)[0]
        return ''

    def checkIfPrefixExists(self, prefix:str) -> bool:
        return prefix in self.boardData.getCommonTypeGroupedComponents()['T'] or prefix in self.boardData.getCommonTypeGroupedComponents()['B']

    def setBoardData(self, boardData:board.Board, isMakeBackup:bool=True):
        self._resetSelectionCollections()
        self._resetSurfaceVariables()
        
        self.boardData = boardData
        if isMakeBackup:
            self.boardDataBackup = copy.deepcopy(boardData)

        self._buildAreaCache()
        self._centerBoard()
        
    
    def _resetSelectionCollections(self):
        self.selectedComponentsSet = set()
        self.allSelectedNetComponentsSet = set()
        self.selectedCommonTypePrefix = ''
        self.selectedNet = dict()
        self.selectedNetComponentSet = set()
    
    def _resetSurfaceVariables(self):
        self.scaleStep = 0
        self.offsetVector = [0, 0]
        self.sidesForFlipX = {'T'}
        self.surfaceDimensions = [self.CHUNK_SIZE_PX, self.CHUNK_SIZE_PX]
        self.boardBaseRectangle = None
        self.fontCache = {}
    
    def getMostCommonPrefixInterface(self) -> str:
        return self.boardData.getMostCommonPrefix()

    def moveBoardInterface(self, targetSurface:pygame.Surface, relativeXY:list[int, int]) -> pygame.Surface:
        self._updateOffsetVector(relativeXY)                    
        return self._blitBoardSurfacesIntoTarget(targetSurface)
    
    def scaleUpDownInterface(self, targetSurface:pygame.Surface, isScaleUp:bool, pointXY:list[int, int], side:str) -> pygame.Surface:
        if isScaleUp:
            isBlit = self._scaleUp(pointXY)
        else:
            isBlit = self._scaleDown(pointXY)

        if isBlit:
            targetSurface = self.drawAndBlitInterface(targetSurface, side)
        return targetSurface
    
    def changeSideInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        return self.drawAndBlitInterface(targetSurface, side)
    
    def rotateBoardInterface(self, targetSurface:pygame.Surface,  isClockwise:bool, side:str, angleDeg:float=None) -> pygame.Surface:
        self._rotate(isClockwise, angleDeg)     
        return self.drawAndBlitInterface(targetSurface, side)
    
    def findComponentByNameInterface(self, targetSurface:pygame.Surface, componentName:str, side:str) -> pygame.Surface:
        self._findComponentByName(componentName)
        return self.drawAndBlitInterface(targetSurface, side)
    
    def componentInScreenCenterInterface(self, targetSurface:pygame.Surface, componentName:str, side:str) -> pygame.Surface:
        componentInstance = self.boardData.getElementByName('components', componentName)
        if componentInstance:
            componentSide  = componentInstance.getSide()
            if componentSide == side:
                self._setComponentInScreenCenter(componentInstance, side)
            return self.drawAndBlitInterface(targetSurface, side)
    
    def clearFindComponentByNameInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._unselectComponents()
        return self.drawAndBlitInterface(targetSurface, side)
    
    def selectNetByNameInterface(self, targetSurface:pygame.Surface, netName:str, side:str) -> pygame.Surface:
        if netName:
            self._selectNet(netName)
        else:
            self._unselectNet()
        return self.drawAndBlitInterface(targetSurface, side)
    
    def selectNetComponentByNameInterface(self, targetSurface:pygame.Surface, componentName:str, side:str) -> pygame.Surface:
        self._selectNetComponentByName(componentName)
        return self.drawAndBlitInterface(targetSurface, side)
    
    def unselectNetInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._unselectNet()
        return self.drawAndBlitInterface(targetSurface, side)
    
    def showCommonTypeComponentsInterface(self, targetSurface:pygame.Surface, prefix:str, side:str) -> pygame.Surface:
        self._selectCommonTypeComponents(side, prefix)
        return self.drawAndBlitInterface(targetSurface, side)
    
    def clearCommonTypeComponentsInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._unselectCommonTypeComponents()
        return self.drawAndBlitInterface(targetSurface, side)
    
    def flipUnflipCurrentSideInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._flipUnflipCurrentSide(side)
        return self.drawAndBlitInterface(targetSurface, side)
    
    def useComponentAreaInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        BoardWrapper.useAreaFromComponentsInPlace(self.boardData)
        boardDataNormalized = self._getNormalizedBoard(self.screenDimensions, self.boardData)
        self.setBoardData(boardDataNormalized, isMakeBackup=False)
        return self.drawAndBlitInterface(targetSurface, side)
    
    def resetToDefaultViewInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self.boardData = copy.deepcopy(self.boardDataBackup)
        self.setBoardData(self.boardData)
        return self.drawAndBlitInterface(targetSurface, side)

    def showHideOutlinesInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._showHideOutlines()
        return self.drawAndBlitInterface(targetSurface, side)

    def showHideComponentNamesInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._showHideComponentNames()
        return self.drawAndBlitInterface(targetSurface, side)

    def changeScreenDimensionsInterface(self, targetSurface:pygame.Surface, dimensions:tuple[int, int], side:str) -> pygame.Surface:
        self.screenDimensions = dimensions[:]
        boardDataNormalized = self._getNormalizedBoard(dimensions, self.boardData)
        self.setBoardData(boardDataNormalized, isMakeBackup=True)
        return self.drawAndBlitInterface(targetSurface, side)

    def drawAndBlitInterface(self, targetSurface:pygame.Surface, side:str) -> pygame.Surface:
        self._chunkifyBoard(side)
        return self._blitVisibleChunksIntoScreen(targetSurface)

    def _getNormalizedBoard(self, surfaceDimensions:tuple[int, int], boardInstance:board.Board) -> board.Board:
        width, height = surfaceDimensions
        wrapper = BoardWrapper(width, height)
        wrapper.setBoard(boardInstance)
        return wrapper.normalizeBoard()
    
    def _setBaseRectangle(self, baseWidth:float|int, baseHeight:float|int):
        bottomLeftPoint = gobj.Point(0, 0)
        topRightPoint = gobj.Point(baseWidth, baseHeight)
        self.boardBaseRectangle = gobj.Rectangle(bottomLeftPoint, topRightPoint)
    
    def _updateSurfaceDimensions(self, factor:float=1):
        baseWidth, baseHeight = self._calculateBaseRectangleAreaWidthHeight()
        self.surfaceDimensions = [baseWidth * factor, baseHeight * factor]
    
    def _calculateBaseRectangleAreaWidthHeight(self) -> tuple[float|int, float|int]:
        areaPoints = self.boardBaseRectangle.calculateArea()
        baseWidth, baseHeight = Shape.getAreaWidthHeight(areaPoints)
        return baseWidth, baseHeight
    
    def _setOffsetVector(self, vector:tuple[int, int]):
        self.offsetVector = vector
    
    def _updateOffsetVector(self, relativeVector:tuple[int, int]):
        xMove, yMove = self.offsetVector
        dx, dy = relativeVector
        self.offsetVector = [xMove + dx, yMove + dy]
    
    def _rotate(self, isClockwise:bool, angleDeg:float=None):
        if not angleDeg:
            angleDeg = self.DELTA_ROTATION_ANGLE_DEG
        angleDeg *= (-1) ** int(isClockwise)  # overengineered +1 or -1 multilpication

        xTarget, yTarget = Shape.calculateAreaCenterXY(self.boardData.getArea())
        BoardWrapper.rotateBoardInPlaceAroundAreaCenter(self.boardData, angleDeg)
        self._rotateBaseRectangleAroundItsCenter(angleDeg)
        
        currentScaleFactor = self.SCALE_BASE ** self.scaleStep
        self._updateSurfaceDimensions(currentScaleFactor)        
        self._centerBoardInAdjustedSurface()
        x, y = Shape.calculateAreaCenterXY(self.boardData.getArea())

        deltaVector = xTarget - x, yTarget - y
        self._updateOffsetVector(deltaVector)
    
    def _rotateBaseRectangleAroundItsCenter(self, angleDeg:float):
        baseWidth, baseHeight = self._calculateBaseRectangleAreaWidthHeight()
        baseRotationPoint = gobj.Point(baseWidth / 2, baseHeight / 2)
        self.boardBaseRectangle.rotateInPlace(baseRotationPoint, angleDeg)
    
    def _scaleUp(self, zoomingPoint:tuple[int, int]) -> bool:
        if self.scaleStep + 1 > self.STEP_MAX:
            return False

        previousStep = self.scaleStep
        self.scaleStep += 1
        self._commonScalingOperations(zoomingPoint, previousStep)
        return True

    def _scaleDown(self, zoomingPoint:tuple[int, int]):
        if self.scaleStep - 1 < self.STEP_MIN:
            return False
        
        previousStep = self.scaleStep
        self.scaleStep -= 1
        self._commonScalingOperations(zoomingPoint, previousStep)
        return True
    
    def _commonScalingOperations(self, zoomingPoint:tuple[int, int], previousStepValue:int):
        # surface dimensions must be updated as a value from expotential formula
        scaleFactor = self.SCALE_BASE ** self.scaleStep
        self._updateSurfaceDimensions(scaleFactor)

        # offset for zooming in place must be calculated based on current scale and previous scaling factor
        previousScaleFactor = self.SCALE_BASE ** previousStepValue
        newOffset = self._calculateOffsetVectorForScaledSurface(zoomingPoint, previousScaleFactor)
        self._setOffsetVector(newOffset)

        # board is scaled by multiplication by a relative factor (self.SCALE_BASE or 1/self.SCALE_BASE)
        relativeScaleFactor = self.SCALE_BASE if (self.scaleStep - previousStepValue) > 0 else 1 / self.SCALE_BASE
        BoardWrapper.scaleBoardInPlace(self.boardData, relativeScaleFactor)
    
    def findComponentByClick(self, cursorXY:list[int, int], side:str) -> list[str]:
        x, y = cursorXY
        xOffset, yOffset = self.offsetVector

        x = x - xOffset
        y = y - yOffset
        if side in self.sidesForFlipX:
            x = self._xForMirroredSurface(x)
            
        clickedPoint = gobj.Point(x, y)
        return self.boardData.findComponentByCoords(clickedPoint, side)
    
    def _findComponentByName(self, componentName:str) -> comp.Component|None:
        componentInstance = self.boardData.getElementByName('components', componentName)
        if not componentInstance:
            return
        
        if componentInstance.name in self.selectedComponentsSet:
            self.selectedComponentsSet.remove(componentInstance.name)
            return
        else:
            self.selectedComponentsSet.add(componentInstance.name)
            return componentInstance
    
    def _selectNetComponentByName(self, componentName:str):
        if componentName in self.selectedNetComponentSet:
            self.selectedNetComponentSet = set()

        elif componentName in self.allSelectedNetComponentsSet:
            self.selectedNetComponentSet = {componentName}
    
    def _setComponentInScreenCenter(self, componentInstance:comp.Component, side:str):
        coords = componentInstance.getCoords()
        xComp, yComp = coords.getXY()
        xScreen, yScreen = self.screenDimensions

        if side in self.sidesForFlipX:
            xComp = self._xForMirroredSurface(xComp)
        x = xScreen / 2 - xComp
        y = yScreen / 2 - yComp

        self._setOffsetVector([x, y])
    
    def _selectNet(self, netName:str):
        net = self.boardData.getElementByName('nets', netName)
        if not net:
            return
        
        self.allSelectedNetComponentsSet = set(net)
        for componentName, parameters in net.items():
            self.selectedNet[componentName] = parameters['pins']
    
    def _unselectComponents(self):
        self.selectedComponentsSet = set()
    
    def _unselectNet(self):        
        self.allSelectedNetComponentsSet = set()
        self.selectedNetComponentSet = set()
        self.selectedNet = dict()
    
    def _selectCommonTypeComponents(self, side:str, prefix:str):
        prefix = prefix.upper()
        if prefix in self.boardData.getCommonTypeGroupedComponents()[side]:
            self.selectedCommonTypePrefix = prefix
    
    def _unselectCommonTypeComponents(self):
        self.selectedCommonTypePrefix = ''
    
    def _flipUnflipCurrentSide(self, side:str):
        if side in self.sidesForFlipX:
            self.sidesForFlipX.remove(side)
        else:
           self.sidesForFlipX.add(side) 
    
    def _showHideOutlines(self):
        self.isShowOutlines = not self.isShowOutlines
    
    def _showHideComponentNames(self):
        self.isShowComponentNames = not self.isShowComponentNames
    
    def _centerSurfaceInScreen(self):
        surfaceWidth, surfaceHeight = self.surfaceDimensions
        screenWidth, screenHeight = self.screenDimensions        

        xSurfaceOffset = (screenWidth - surfaceWidth) / 2
        ySurfaceOffset = (screenHeight - surfaceHeight) / 2
        self.offsetVector = [xSurfaceOffset, ySurfaceOffset]
    
    def _centerBoard(self):
        surfaceWidth, surfaceHeight = self.surfaceDimensions
        boardWidth, boardHeight = self.boardData.getWidthHeight()

        xBoardOffset = (surfaceWidth - boardWidth) / 2
        yBoardOffset = (surfaceHeight - boardHeight) / 2
        self.offsetVector = [xBoardOffset, yBoardOffset]
    
    def _calculateOffsetVectorForScaledSurface(self, zoomingPoint:tuple[int, int], previousScaleFactor:float):
        def reverseSurfaceLinearTranslation(screenCoords:list[int, int], offset:list[int, int]) -> tuple[int, int]:
            xScreen, yScreen = screenCoords
            xMove, yMove = offset
            return xScreen - xMove, yScreen - yMove

        def calculatePointCoordsRelativeToSurfaceDimensions(point:tuple[int, int], surfaceDimensions:tuple[int, int]) -> tuple[float, float]:
            x, y = point
            width, height = surfaceDimensions
            return x / width, y / height
        
        def calcluatePointInScaledSurface(surfaceDimensions:tuple[int, int], relativePosition:tuple[float, float]) -> tuple[int, int]:
            width, height = surfaceDimensions
            xRel, yRel = relativePosition
            return round(width * xRel), round(height * yRel)
        
        def translateScaledPointToCursorPosition(point:tuple[int, int], cursorPosition:tuple[float, float]) -> tuple[int, int]:
            x, y = point
            xCursor, yCursor = cursorPosition
            return xCursor - x, yCursor - y
        #####################################
        
        areaPoints = self.boardBaseRectangle.calculateArea()
        surfaceBaseDimensions = Shape.getAreaWidthHeight(areaPoints)
        originSurfaceDimensions = [val * previousScaleFactor for val in surfaceBaseDimensions]

        pointMoveReversed = reverseSurfaceLinearTranslation(zoomingPoint, self.offsetVector)
        pointRelativeToSurface = calculatePointCoordsRelativeToSurfaceDimensions(pointMoveReversed, originSurfaceDimensions)
        pointInScaledSurface = calcluatePointInScaledSurface(self.surfaceDimensions, pointRelativeToSurface)
        resultOffset = translateScaledPointToCursorPosition(pointInScaledSurface, zoomingPoint)
        return resultOffset
    
    def _chunkifyBoard(self, side:str):   
        width, height = self.boardData.getWidthHeight()
        rows = math.ceil(width / self.CHUNK_SIZE_PX)
        cols = math.ceil(height / self.CHUNK_SIZE_PX)
        
        iRange, jRange = range(rows), range(cols)
        
        for i, j in itertools.product(iRange, jRange):
            coords = i * self.CHUNK_SIZE_PX, j * self.CHUNK_SIZE_PX
            chunkSurface = self._drawChunk(side, coords)
            self.surfaceChunks[(i, j)] = chunkSurface


    def _drawBoard(self, side:str):         
        def drawSelectedNets(side:str):
            componentNames = list(self.selectedNetComponentSet)
            color = self.colorsDict['selected net marker']
            self._drawSelectedPins(surface=self.selectedNetSurface, color=color, side=side)
            self._drawMarkers(surface=self.selectedNetSurface, componentNamesList=componentNames, color=color, side=side)
        
        def renderText(side:str):
            if self.isShowComponentNames:
                color = self.colorsDict['outlines']
                sideComponents = self.boardData.getSideGroupedComponents()[side]
                isFlipX = side in self.sidesForFlipX
                self._renderComponentNames(surface=self.fontSurface, sideComponents=sideComponents, color=color, isFlipX=isFlipX)
        
        raise ValueError        
        drawSelectedNets(side)
        renderText(side)
        self._flipSurfaceXAxis(side)   


    def _drawChunk(self, side:str, coords:tuple[int, int]) -> pygame.surface:
        chunkSurface = self._getEmptySurfce()

        chunkCornersXY =  self._calculateChunkBoundariesXYXY(coords)
        chunkSurface = self._drawOutlinesInChunk(chunkSurface, chunkCornersXY)
        chunkSurface = self._drawComponentsInChunk(chunkSurface, chunkCornersXY, side)
        chunkSurface = self._drawCommonTypeComponentsInChunk(chunkSurface, chunkCornersXY, side)
        chunkSurface = self._drawMarkersInChunk(chunkSurface, chunkCornersXY, side)
        chunkSurface = self._drawSelectedNetPadsInChunk(chunkSurface, chunkCornersXY, side)
        chunkSurface = self._drawSelectedNetComponentsInChunk(chunkSurface, chunkCornersXY, side)
        # add rendering text when above will work

        ## DEBUG
        #pygame.draw.rect(chunkSurface, (255, 0, 0), (0, 0, self.CHUNK_SIZE_PX, self.CHUNK_SIZE_PX), width=2)
        #pygame.image.save(chunkSurface, f"debug_chunk_{coords}.png")
        return chunkSurface
    
    def _drawOutlinesInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int]) -> pygame.Surface:
        if not self.isShowOutlines:
            return chunkSurface

        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        for shape in self.areaCache['outlines']:
            areaCornersXYXY = Shape.getAreaAsXYXY(shape.getArea())
            if not self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                continue
            
            shapeType = shape.getType()
            color = self.colorsDict['outlines']
            self.drawHandler[shapeType](chunkSurface, color, shape, chunkOffsetXY=chunkOffsetXY, width=1)
        return chunkSurface
    
    def _drawComponentsInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int], side:str) -> pygame.Surface:
        componentsToDraw = []
        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        for componentName, componentArea in self.areaCache[side].items():
            areaCornersXYXY = Shape.getAreaAsXYXY(componentArea)

            if self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                componentsToDraw.append(componentName)

        self._drawComponents(surface=chunkSurface, componentNamesList=componentsToDraw, side=side, chunkOffsetXY=chunkOffsetXY, width=1)
        return chunkSurface        
        
    def _drawCommonTypeComponentsInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int], side:str) -> pygame.Surface:
        commonTypeComponents = self.boardData.getCommonTypeGroupedComponents()[side]
        if not self.selectedCommonTypePrefix in commonTypeComponents:
            return chunkSurface     
        
        componentsToDraw = []
        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        componentNames = commonTypeComponents[prefix]
        for componentName in componentNames:
            componentArea = self.areaCache[side][componentName]
            areaCornersXYXY = Shape.getAreaAsXYXY(componentArea)

            if self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                componentsToDraw.append(componentName)

        self._drawComponents(surface=chunkSurface, componentNamesList=componentsToDraw, side=side, chunkOffsetXY=chunkOffsetXY, width=0)
        return chunkSurface
    
    def _drawMarkersInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int], side:str) -> pygame.Surface:
        componentNames = list(self.selectedComponentsSet)
        componentsToDraw = []
        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        for componentName in componentNames:
            componentArea = self.areaCache[side][componentName]
            areaCornersXYXY = Shape.getAreaAsXYXY(componentArea)

            if self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                componentsToDraw.append(componentName)
        
        color = self.colorsDict['selected component marker']
        self._drawMarkers(surface=chunkSurface, componentNamesList=componentNames, color=color, side=side, chunkOffsetXY=chunkOffsetXY)
        return chunkSurface    
             
    def _drawSelectedNetPadsInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int], side:str) -> pygame.Surface:
        if not self.selectedNet:
            return chunkSurface
        
        componentsToDraw = []
        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        for componentName in self.selectedNet:
            componentArea = self.areaCache[side][componentName]
            areaCornersXYXY = Shape.getAreaAsXYXY(componentArea)

            if self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                componentsToDraw.append(componentName)

        netComponentsInChunk = set(componentsToDraw)
        self._drawSelectedPins(surface=chunkSurface, componentNamesSet=netComponentsInChunk, side=side, chunkOffsetXY=chunkOffsetXY)
        return chunkSurface
    
    def _drawSelectedNetComponentsInChunk(self, chunkSurface:pygame.Surface, chunkCornersXYXY:tuple[int, int, int, int], side:str) -> pygame.Surface:
        if not self.selectedNet:
            return chunkSurface
        
        componentsToDraw = []
        xChunkOffset, yChunkOffset, *_ = chunkCornersXYXY
        chunkOffsetXY = [xChunkOffset, yChunkOffset]
        for componentName in list(self.selectedNetComponentSet):
            componentArea = self.areaCache[side][componentName]
            areaCornersXYXY = Shape.getAreaAsXYXY(componentArea)

            if self._is2AreasOverlap(chunkCornersXYXY, areaCornersXYXY):
                componentsToDraw.append(componentName)

        color = self.colorsDict['selected net marker']
        self._drawMarkers(surface=self.selectedNetSurface, componentNamesList=componentsToDraw, color=color, side=side, chunkOffsetXY=chunkOffsetXY)
        return chunkSurface


    def _calculateChunkBoundariesXYXY(self, chunkCoords:tuple[int, int]) -> tuple[int, int, int, int]:
        x0, y0 = chunkCoords
        return x0, y0, x0 + self.CHUNK_SIZE_PX, y0 + self.CHUNK_SIZE_PX

    def _is2AreasOverlap(self, chunkCorners:tuple[int, int, int, int], areaCorners:tuple[int, int, int, int]) -> bool:
        xC_Min, yC_Min, xC_Max, yC_Max = chunkCorners
        xA_Min, yA_Min, xA_Max, yA_Max = areaCorners

        overlapX = (xA_Min <= xC_Max) and (xA_Max >= xC_Min)
        overlapY = (yA_Min <= yC_Max) and (yA_Max >= yC_Min)
        return overlapX and overlapY
    
    def _drawComponents(self, surface:pygame.Surface, componentNamesList:list[str], side:str, chunkOffsetXY:tuple[int, int], width:int=1):
        componentColor = self.colorsDict['components']
        pinColorDict = {
            'SMT': self.colorsDict['SMT pins'], 
            'SMD': self.colorsDict['SMT pins'], 
            'TH':self.colorsDict['TH pins']
        }
        
        componentColor = self.colorsDict['components']
        for componentName in componentNamesList:
            componentInstance = self.boardData.getElementByName('components', componentName)
            mountingType = componentInstance.getMountingType()
            componentSide = componentInstance.getSide()
            pinsDict = componentInstance.getPins()

            numOfPins = len(pinsDict)
            isSkipComponentSMT = mountingType == 'SMT' and componentSide == side and numOfPins == 1
            isSkipComponentTH = mountingType == 'TH' and componentSide != side
            isDrawComponent = not (isSkipComponentSMT or isSkipComponentTH)
            if isDrawComponent:
                self._drawInstanceAsCirlceOrPolygon(surface, componentInstance, componentColor, chunkOffsetXY, width)

            pinsColor = pinColorDict[componentInstance.getMountingType()]
            self._drawPins(surface, componentInstance, pinsColor, chunkOffsetXY, width)
    
    def _drawMarkers(self, surface:pygame.Surface, componentNamesList:list[str], color:tuple[int, int, int], side:str, chunkOffsetXY:tuple[int, int]):
        for componentName in componentNamesList:
            componentInstance = self.boardData.getElementByName('components', componentName)
            if componentInstance.getMountingType() == 'TH' or componentInstance.getSide() == side:
                centerPoint = componentInstance.getCoords()
                self._drawMarkerArrow(surface, centerPoint.getXY(), color, chunkOffsetXY)
    
    def _drawSelectedPins(self, surface:pygame.Surface, componentNamesSet:set, side:str, chunkOffsetXY:tuple[int, int]):
        color = self.colorsDict['selected net marker']
        for componentName, pinsList in self.selectedNet.items():
            if componentName not in componentNamesSet:
                continue

            componentInstance = self.boardData.getElementByName('components', componentName)
            pinsInstancesList = [componentInstance.getPinByName(pinName) for pinName in pinsList if componentInstance]
            for pinInstance in pinsInstancesList:
                if componentInstance.getMountingType() == 'TH' or componentInstance.getSide() == side:
                    self._drawInstanceAsCirlceOrPolygon(surface, pinInstance, color, chunkOffsetXY, width=0)

    def _drawPins(self, surface:pygame.Surface, componentInstance:comp.Component, color:tuple[int, int, int], chunkOffsetXY:tuple[int, int], width:int=1):
        pinsDict = componentInstance.getPins()
        for _, pinInstance in pinsDict.items():
            self._drawInstanceAsCirlceOrPolygon(surface, pinInstance, color, chunkOffsetXY, width)
    
    def _renderComponentNames(self, surface:pygame.Surface, sideComponents:list[str], color:tuple[int, int, int], isFlipX:bool):
        MIN_COMPONENT_SIZE_PX = 10
        EXAMPLE_FONT_SIZE = 10

        for componentName in sideComponents:
            componentInstance = self.boardData.getElementByName('components', componentName)
            area = componentInstance.getArea()
            width, height = Shape.getAreaWidthHeight(area)

            if max(width, height) < MIN_COMPONENT_SIZE_PX:
                continue

            textWidth, textHeight = self._getFontWidthHeight(EXAMPLE_FONT_SIZE, componentName)
            targetFontSize = self._calculateFontSize(width, height, textWidth, textHeight, EXAMPLE_FONT_SIZE)

            font = self._getFont(targetFontSize)
            renderedText = font.render(componentName, True, color)

            centerPoint = componentInstance.getCoords()
            x, y = centerPoint.getXY()
            if isFlipX:
                x = self._xForMirroredSurface(x)
            textRect = renderedText.get_rect(center=(x, y))
            surface.blit(renderedText, textRect)
    
    def _flipSurfaceXAxis(self, side:str):   
        if side in self.sidesForFlipX:  
            self.boardLayer = pygame.transform.flip(self.boardLayer, True, False)
            self.selectedComponentsSurface = pygame.transform.flip(self.selectedComponentsSurface, True, False)
            self.selectedNetSurface = pygame.transform.flip(self.selectedNetSurface, True, False)
            self.commonTypeComponentsSurface = pygame.transform.flip(self.commonTypeComponentsSurface, True, False)
    
    def _drawInstanceAsCirlceOrPolygon(self, surface:pygame.Surface, instance: pin.Pin|comp.Component, color:tuple[int, int, int], 
                                            chunkOffsetXY:tuple[int, int], width:int=1):
        if  instance.getShape() == 'CIRCLE':
            shape = instance.getShapeData()
            self._drawCircle(surface, color, shape, chunkOffsetXY, width)
        else:
            pointsList = instance.getShapePoints()
            self._drawPolygon(surface, color, pointsList, chunkOffsetXY, width)
    
    def _blitVisibleChunksIntoScreen(self, targetSurface:pygame.Surface) -> pygame.Surface:
        color = self.colorsDict['background']
        targetSurface.fill(color)

        screenWidth, screenHeight = self.screenDimensions
        xOffset, yOffset = self.offsetVector

        screenLeft = -xOffset
        screenTop = -yOffset
        screenRight = screenLeft + screenWidth
        screenBottom = screenRight + screenHeight

        iStart = int(screenLeft // self.CHUNK_SIZE_PX)
        jStart = int(screenTop // self.CHUNK_SIZE_PX)
        iEnd = int(screenRight // self.CHUNK_SIZE_PX)
        jEnd = int(screenBottom // self.CHUNK_SIZE_PX)

        rowRange = range(iStart, iEnd)
        colRange = range(jStart, jEnd)
        for i, j in itertools.product(rowRange, colRange):
            chunkKey = i, j
            if chunkKey not in self.surfaceChunks:
                continue

            chunkSurface = self.surfaceChunks[chunkKey]
            xDraw = (i * self.CHUNK_SIZE_PX) + xOffset
            yDraw = (j * self.CHUNK_SIZE_PX) + yOffset
            
            chunkSurface.set_colorkey(color)
            targetSurface.blit(chunkSurface, [xDraw, yDraw])
            
        return targetSurface
        
    def _blitBoardSurfacesIntoTarget(self, targetSurface:pygame.Surface) -> pygame.Surface:
        raise ValueError
    

    def _drawLine(self, surface:pygame.Surface, color:tuple[int, int, int], lineInstance:gobj.Line, chunkOffsetXY:tuple[int, int], width:int=1):
        startPoint, endPoint = lineInstance.getPoints()
        xOffset, yOffset = chunkOffsetXY
        x0, y0 = startPoint.getXY()
        x1, y1 = endPoint.getXY()

        startXY = x0 - xOffset, y0 - yOffset
        endXY = x1 - xOffset, y1 - yOffset
        pygame.draw.line(surface, color, startXY, endXY, width)

    def _drawArc(self, surface:pygame.Surface, color:tuple[int, int, int], arcInstance:gobj.Arc, chunkOffsetXY:tuple[int, int], width:int=1):
        def inversedAxisAngle(angleRad:float):
            return 2 * math.pi - angleRad

        rotationPoint, radius, startAngle, endAngle = arcInstance.getAsCenterRadiusAngles()
        x0, y0 = rotationPoint.getXY()
        xOffset, yOffset = chunkOffsetXY

        xStart = x0 - radius - xOffset
        yStart = y0 - radius - yOffset

        startAngle, endAngle = inversedAxisAngle(endAngle), inversedAxisAngle(startAngle)
        pygame.draw.arc(surface, color, (xStart, yStart, 2 * radius, 2 * radius), startAngle, endAngle, width)

    def _drawCircle(self, surface:pygame.Surface, color:tuple[int, int, int], circleInstance:gobj.Circle, chunkOffsetXY:tuple[int, int], width:int=1):
        centerPoint, radius = circleInstance.getCenterRadius()
        x0, y0 = centerPoint.getXY()
        xOffset, yOffset = chunkOffsetXY

        xStart = x0 - radius - xOffset
        yStart = y0 - radius - yOffset
        pygame.draw.circle(surface, color, (xStart, yStart), radius, width)

    def _drawPolygon(self, surface:pygame.Surface, color:tuple[int, int, int], pointsList:list[gobj.Point], chunkOffsetXY:tuple[int, int], width:int=1):
        def applyOffset(pointXY:tuple[float, float], offsetXY:tuple[int, int]) -> tuple[float, float]:
            x0, y0 = pointXY
            xOffset, yOffset = offsetXY
            return x0 - xOffset, y0 - yOffset
            
        pointsXYList = [applyOffset(point.getXY(), chunkOffsetXY) for point in pointsList]
        pygame.draw.polygon(surface, color, pointsXYList, width)
    
    def _drawMarkerArrow(self, surface:pygame.Surface, coordsXY:list[int, int], color:tuple[int, int, int], chunkOffsetXY:tuple[int, int]):
        x, y = coordsXY
        xOffset, yOffset = chunkOffsetXY

        x -= xOffset
        y -= yOffset
        k = self.SCALE_BASE ** self.scaleStep
        markerCoords = [
            (x, y), 
            (x - (5 * k), y - (12 * k)), 
            (x - (2 * k), y - (12 * k)), 
            (x - (2 * k), y - (60 * k)), 
            (x + (2 * k), y - (60 * k)), 
            (x + (2 * k), y - (12 * k)), 
            (x + (5 * k), y - (12 * k))
        ]
        pygame.draw.polygon(surface, color, markerCoords, width=0)
    
    def _getEmptySurfce(self) -> pygame.Surface:
        color = self.colorsDict['background']
        surface = pygame.Surface(self.surfaceDimensions)
        surface.fill(color)
        return surface
    
    def _getFontWidthHeight(self, fontSize:int, textToRender:str) -> tuple[int, int]:
        font = self._getFont(fontSize)
        textWidth, textHeight = font.size(textToRender)
        return textWidth, textHeight
    
    def _calculateFontSize(self, width:int, height:int, exampleTextWidth:int, exampleTextHeight:int, exampleFontSize:int) -> int:
        sizeByWidth = (width / exampleTextWidth) * exampleFontSize
        sizeByHeight = (height / exampleTextHeight) * exampleFontSize

        fontSize = int(min(sizeByWidth, sizeByHeight))
        fontSize = max(self.MIN_FONT_SIZE, min(fontSize, self.MAX_FONT_SIZE))
        return fontSize
    
    def _getFont(self, fontSize:int) -> pygame.font.Font:
        size = max(1, int(fontSize))
        if size not in self.fontCache:
            self.fontCache[size] = pygame.font.SysFont('Arial', size)
        return self.fontCache[size]
    
    def _xForMirroredSurface(self, x:float) -> float:
        surfaceWidth, _ = self.surfaceDimensions
        return surfaceWidth - x
    
    def _pinStringValue(self, pinName:str) -> int:
        if pinName.isnumeric():
            return int(pinName)
        else:
            return sum([ord(char) for char in pinName])
    
    def _componentStringValue(self, componentName:str):
        ## split component name into letters and digits. Calculate value as [ord(char1) + ord(char2) + ...] * 1000 + componentNumber
        stringValue = lambda componentType: sum([ord(char) for char in componentType]) * 1000

        try:
            componentType, componentNumber, *_ = list(filter(None, re.split(r'(\d+)', componentName)))
            if not componentNumber.isnumeric():
                componentNumber = 0
        except ValueError:
            componentType = componentName
            componentNumber = 0
        return stringValue(componentType) + int(componentNumber)
    
    def _buildAreaCache(self):
        self.areaCache = {}
        self.areaCache['outlines'] = self.boardData.getOutlines()

        sideComponentsDict = self.boardData.getSideGroupedComponents()
        for side, sideComponentsList in sideComponentsDict.items():
            self.areaCache[side] = {}
            for componentName in sideComponentsList:
                componentInstance = self.boardData.getElementByName('components', componentName)
                self.areaCache[side][componentName] = componentInstance.getArea()

        


if __name__ == '__main__':
    def openSchematicFile() -> str:        
        from tkinter import filedialog
        filePath = filedialog.askopenfile(mode='r', filetypes=[('*', '*')])
        return filePath.name
    
    WIDTH, HEIGHT = 1485, 841
    FPS = 60

    sideQueue = ['B', 'T']
    side = 'T'
    isMousePressed = False
    isMovingCalledFirstTime = True
    isFindComponentByClickActive = False

    filePath = openSchematicFile()
    wrapper = BoardWrapper(WIDTH, HEIGHT)
    wrapper.loadAndSetBoardFromFilePath(filePath)
    boardInstance = wrapper.normalizeBoard()

    ## pygame
    WIN = pygame.display.set_mode((WIDTH, HEIGHT))
    clock = pygame.time.Clock()
    pygame.display.set_caption(filePath)

    engine = DrawBoardEngine(WIDTH, HEIGHT)
    engine.setBoardData(boardInstance)    
    print('Components: ', engine.getComponents())
    print('Nets: ', engine.getNets())

    engine.drawAndBlitInterface(WIN, side)
    print('====================================')
    print('Pygame draw PCB engine')
    print('Move - mouse dragging')
    print('Zoom - scroll wheel')    
    print('Change side - ;')
    print('Rotate - , .')    
    print('Reset to default view - r')
    print('Use components for area calculation - d')
    print('Show/hide outlines - f')
    print('Flip unflip current side - m')
    print('Select component by click mode - z')
    print('Find component by name - x')
    print('Clear arrow markers - c')
    print('Find net by name - v')
    print('Clear selected net - b')
    print('Highlight common type components - a')
    print('Clear common type components - s')
    print('Change screen surface dimensions - g')
    print('Set component in screen center - h')
    print('Select component on net (net must be drawn before) - j')
    print('Show/hide component names - k')
    print('====================================')

    run = True
    while run:
        clock.tick(FPS)

        ## handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if event.button == 1:
                    isMousePressed = True
                    isMovingCalledFirstTime = True    
                    if isFindComponentByClickActive:
                        foundComponents = engine.findComponentByClick(pygame.mouse.get_pos(), side)
                        print(f'clicked component: {foundComponents}')

            elif event.type == pygame.MOUSEBUTTONUP:
                isMousePressed = False

            elif event.type == pygame.MOUSEMOTION:
                if isMousePressed:
                    dx, dy = pygame.mouse.get_rel()
                    if not isMovingCalledFirstTime:
                        engine.moveBoardInterface(WIN, [dx, dy])
                    else:
                        isMovingCalledFirstTime = False
            
            elif event.type == pygame.MOUSEWHEEL:
                pointXY = pygame.mouse.get_pos()
                if event.y > 0:
                    engine.scaleUpDownInterface(WIN, isScaleUp=True, pointXY=pointXY, side=side)
                else:
                    engine.scaleUpDownInterface(WIN, isScaleUp=False, pointXY=pointXY, side=side)

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SEMICOLON:
                    side = sideQueue.pop(0)
                    sideQueue.append(side)
                    engine.changeSideInterface(WIN, side)
                
                elif event.key == pygame.K_PERIOD:
                    engine.rotateBoardInterface(WIN, isClockwise=True, side=side)
                
                elif event.key == pygame.K_COMMA:
                    engine.rotateBoardInterface(WIN,  isClockwise=False, side=side)
                
                elif event.key == pygame.K_z:
                    isFindComponentByClickActive = not isFindComponentByClickActive
                    print(f'Find component using clck mode active: {isFindComponentByClickActive}')
                
                elif event.key == pygame.K_x:
                    componentName = input('Component name: ')
                    engine.findComponentByNameInterface(WIN, componentName, side)
                    print(engine.getComponentPinout(componentName))
                
                elif event.key == pygame.K_c:
                    engine.clearFindComponentByNameInterface(WIN, side)
                
                elif event.key == pygame.K_v:
                    netName = input('Net name: ')
                    engine.selectNetByNameInterface(WIN, netName, side)
                
                elif event.key == pygame.K_b:
                    engine.unselectNetInterface(WIN, side)
                
                elif event.key == pygame.K_a:
                    prefix = input('Common type prefix: ')
                    engine.showCommonTypeComponentsInterface(WIN, prefix, side)
                
                elif event.key == pygame.K_s:
                    engine.clearCommonTypeComponentsInterface(WIN, side)
                
                elif event.key == pygame.K_m:
                    engine.flipUnflipCurrentSideInterface(WIN, side)
                
                elif event.key == pygame.K_d:
                    engine.useComponentAreaInterface(WIN, side)
                
                elif event.key == pygame.K_r:
                    engine.resetToDefaultViewInterface(WIN, side)
                
                elif event.key == pygame.K_f:
                    engine.showHideOutlinesInterface(WIN, side)

                elif event.key == pygame.K_g:
                    width = int(input("New width: "))
                    height = int(input("New height: "))
                    WIN = pygame.display.set_mode((width, height))
                    engine.changeScreenDimensionsInterface(WIN, [width, height], side)

                elif event.key == pygame.K_h:
                    componentName = input('Component name: ')
                    engine.componentInScreenCenterInterface(WIN, componentName, side)
                
                elif event.key == pygame.K_j:
                    componentName = input('Net component name: ')
                    engine.selectNetComponentByNameInterface(WIN, componentName, side)
                
                elif event.key == pygame.K_k:
                    engine.showHideComponentNamesInterface(WIN, side)

        
        ## display image
        pygame.display.update()
        #run = False

    pygame.quit()