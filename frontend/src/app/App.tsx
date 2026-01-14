import { useState, useCallback } from 'react';
import { MapView } from './components/MapView';
import { Overlay } from './components/Overlay';
import { Sidebar } from './components/Sidebar';
import { TrackedObject } from './api/types';

function App() {
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [objects, setObjects] = useState<TrackedObject[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    console.log("App Mounting...");

    // Derive selectedObject from latest objects array
    const selectedObject = selectedObjectId
        ? objects.find(o => o.id === selectedObjectId) || null
        : null;

    // Callback when user clicks a marker
    const handleObjectSelect = useCallback((obj: TrackedObject | null) => {
        setSelectedObjectId(obj ? obj.id : null);
    }, []);

    // Callback when MapView fetches new objects
    const handleObjectsUpdate = useCallback((newObjects: TrackedObject[]) => {
        setObjects(newObjects);
    }, []);

    return (
        <div className="app-shell">
            <Sidebar
                objects={objects}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onSelectObject={handleObjectSelect}
                selectedObjectId={selectedObjectId}
            />
            <Overlay
                selectedObject={selectedObject}
                onCloseDetails={() => setSelectedObjectId(null)}
                sidebarOpen={sidebarOpen}
            />
            <MapView
                onObjectSelect={handleObjectSelect}
                onObjectsUpdate={handleObjectsUpdate}
                selectedObjectId={selectedObjectId}
            />
        </div>
    );
}

export default App;
