(function() {
    const apiFetch = window.Wajina.apiFetch;
    const Telemetry = window.Wajina.Telemetry;

    const StructureService = {
        async getSessions() {
            try {
                return await apiFetch('/api/structure/sessions');
            } catch (err) {
                Telemetry.log('ERROR', 'STRUCTURE', 'Failed to load sessions');
                throw err;
            }
        },

        async getTerms() {
            try {
                return await apiFetch('/api/structure/terms');
            } catch (err) {
                Telemetry.log('ERROR', 'STRUCTURE', 'Failed to load terms');
                throw err;
            }
        },

        async getClasses() {
            try {
                return await apiFetch('/api/structure/classes');
            } catch (err) {
                Telemetry.log('ERROR', 'STRUCTURE', 'Failed to load classes');
                throw err;
            }
        },

        async getArms() {
            try {
                return await apiFetch('/api/structure/arms');
            } catch (err) {
                Telemetry.log('ERROR', 'STRUCTURE', 'Failed to load arms');
                throw err;
            }
        },

        async createSession(data) {
            return await apiFetch('/api/structure/sessions', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async createTerm(data) {
            return await apiFetch('/api/structure/terms', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async createClass(data) {
            return await apiFetch('/api/structure/classes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async createArm(data) {
            return await apiFetch('/api/structure/arms', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async deleteEntity(type, id) {
            const endpointMap = {
                'session': `/api/structure/sessions/${id}`,
                'term': `/api/structure/terms/${id}`,
                'class': `/api/structure/classes/${id}`,
                'arm': `/api/structure/arms/${id}`
            };
            
            if (!endpointMap[type]) throw new Error('Invalid entity type');

            return await apiFetch(endpointMap[type], {
                method: 'DELETE'
            });
        }
    };

    window.Wajina.StructureService = StructureService;
})();
