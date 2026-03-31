class HistoryRequestWrapper{
    static async getBoardHistory(rootUrl, boardSerialNumber){
        const requestUrl = rootUrl + "boardflowfull/history/" + boardSerialNumber;

        const responseJson = await HistoryRequestWrapper._executeHistoryRequest(requestUrl)
        if (responseJson == "") {
            alert("Problem z requestem historii płytki!");
            return []
        }

        const extractedPhases = HistoryRequestWrapper._extractDataFromResponse(responseJson)
        return extractedPhases
    }


    static async _executeHistoryRequest(requestUrl){
        try {
            const response = await fetch(requestUrl, {
                method: 'GET',
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });

            if (!response.ok) {
                throw new Error('Problem z serwerem');
            }
            
            const data = await response.json();
            return data
        
        } catch (error) {
            return ""
        } 
    }

    static _extractDataFromResponse(responseJson) {
        try {
            const historySubJson = responseJson?.payload?.history;
            if (!Array.isArray(historySubJson)) {
                console.warn("Brak 'payload.history' w odpowiedzi lub nie jest tablicą.");
                return [];
            }

            const processedList = historySubJson
                .filter(item => item.hasOwnProperty('testDate'))
                .map(item => {
                    return {
                        processResult: item.result,
                        phaseDescription: item.processStepDescription,
                        machineName: item.phaseDescription,
                        serialNumber: item.board, 
                        internalCode: item.idPart,
                        testDate: item.testDate,
                        measures: item.measures
                    };
                });

                return processedList;

        } catch (error) {
            console.error("Błąd podczas przetwarzania JSON:", error);
            return [];
        }
    }
}