// CONECTOR SCORM 1.2 OFICIAL PARA MOODLE
const ScormProcess = {
    api: null,
    init: function() {
        let win = window;
        let findAttempts = 0;
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAttempts++;
            if (findAttempts > 10) break;
            win = win.parent;
        }
        this.api = win.API || (window.opener ? window.opener.API : null);

        if (this.api) {
            this.api.LMSInitialize("");
            this.api.LMSSetValue("cmi.core.lesson_status", "incomplete");
            this.api.LMSSetValue("cmi.core.score.min", "0");
            this.api.LMSSetValue("cmi.core.score.max", "100");
            this.api.LMSCommit("");
        }
    },
    complete: function(scorePercent = 100) {
        if (this.api) {
            this.api.LMSSetValue("cmi.core.score.raw", String(scorePercent));
            this.api.LMSSetValue("cmi.core.lesson_status", scorePercent >= 60 ? "passed" : "completed");
            this.api.LMSCommit("");
            this.api.LMSFinish("");
        }
    },
    exit: function(scorePercent = 0) {
        if (this.api) {
            this.api.LMSSetValue("cmi.core.score.raw", String(scorePercent));
            this.api.LMSSetValue("cmi.core.exit", "suspend");
            this.api.LMSCommit("");
            this.api.LMSFinish("");
        }
    }
};

window.addEventListener('load', () => ScormProcess.init());
window.addEventListener('unload', () => {
    if (ScormProcess.api) ScormProcess.api.LMSFinish("");
});