var ScormProcess = (function() {
    var apiHandle = null;

    // Busca la API de SCORM 1.2 en la ventana de Moodle
    function getAPI() {
        var theAPI = null;
        var attempts = 0;
        var win = window;
        while (win.API == null && win.parent != null && win.parent != win && attempts < 10) {
            attempts++;
            win = win.parent;
        }
        if (win.API != null) {
            theAPI = win.API;
        }
        return theAPI;
    }

    // Inicializa la conexión con Moodle
    function init() {
        apiHandle = getAPI();
        if (apiHandle) {
            apiHandle.LMSInitialize("");
            const status = apiHandle.LMSGetValue("cmi.core.lesson_status");
            if (status === "not attempted" || status === "unknown") {
                apiHandle.LMSSetValue("cmi.core.lesson_status", "incomplete");
            }
            apiHandle.LMSCommit("");
        } else {
            console.warn("SCORM API no detectada. Ejecutando en modo local.");
        }
    }

    // Envía la calificación (0-100) y el estado
    function complete(score) {
        if (apiHandle) {
            apiHandle.LMSSetValue("cmi.core.score.raw", score.toString());
            apiHandle.LMSSetValue("cmi.core.score.min", "0");
            apiHandle.LMSSetValue("cmi.core.score.max", "100");
            apiHandle.LMSSetValue("cmi.core.lesson_status", "completed");
            apiHandle.LMSCommit("");
        }
    }

    // Cierra la sesión (Llamado al hacer clic en Salir)
    function exit(score) {
        if (apiHandle) {
            if (score !== undefined && score !== null) {
                apiHandle.LMSSetValue("cmi.core.score.raw", score.toString());
            }
            apiHandle.LMSCommit("");
            apiHandle.LMSFinish("");
        }
    }

    // Auto-inicializar al cargar el script
    init();

    return {
        api: apiHandle,
        complete: complete,
        exit: exit
    };
})();