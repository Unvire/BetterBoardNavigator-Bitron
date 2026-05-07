class HistoryRequestWrapper{
    static async getBoardHistory(rootUrl, boardSerialNumber){
        const requestUrl = rootUrl + "boardflowfull/history/" + boardSerialNumber;

        const responseJson = await HistoryRequestWrapper._executeHistoryRequest(requestUrl)
        if (responseJson == "") {
            const lang = document.documentElement.lang;
            const alertMessage = translationsDict[lang]?.["js-history-request-alert"] || "Problem z requestem historii płytki!";

            alert(alertMessage);
            return []
        }

        const extractedPhases = HistoryRequestWrapper._extractDataFromResponse(responseJson)
        return extractedPhases
    }


    static async _executeHistoryRequest(requestUrl){
        try {
            const response = await fetch(requestUrl, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                },
            });

            if (!response.ok) {
                throw new Error("Problem z serwerem");
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
                const lang = document.documentElement.lang;
                const warnMessage = translationsDict[lang]?.["js-no-payload-warning"] || "Brak \"payload.history\" w odpowiedzi lub nie jest tablicą.";

                console.warn(warnMessage);
                return [];
            }

            const processedList = historySubJson
                .filter(item => item.hasOwnProperty("testDate"))
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
            const lang = document.documentElement.lang;
            const errorMessage = translationsDict[lang]?.["js-request-json-parsing-error"] || "Błąd podczas przetwarzania JSON:";

            console.error(errorMessage, error);
            return [];
        }
    }
}