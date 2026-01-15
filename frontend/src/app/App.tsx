import { useState, useCallback } from 'react';
import { MapView } from './components/MapView.tsx';
import { Overlay } from './components/Overlay.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TrackedObject, Zone } from './api/types.ts';
import { api } from './api/client.ts';

function App() {
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [objects, setObjects] = useState<TrackedObject[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [drawTrigger, setDrawTrigger] = useState(0);
    const [zoneRefreshTrigger, setZoneRefreshTrigger] = useState(0);

    console.log("App Mounting...");

    // Derive selectedObject from latest objects array
    const selectedObject = selectedObjectId
        ? objects.find(o => o.id === selectedObjectId) || null
        : null;

    // Callback when user clicks a marker
    const handleObjectSelect = useCallback((obj: TrackedObject | null) => {
        setSelectedObjectId(obj ? obj.id : null);
        setIsFollowing(false); // Reset follow on new selection
    }, []);

    // Callback when MapView fetches new objects
    const handleObjectsUpdate = useCallback((newObjects: TrackedObject[]) => {
        setObjects(newObjects);
    }, []);

    // Callback when MapView fetches/updates zones
    const handleZonesUpdate = useCallback((newZones: Zone[]) => {
        setZones(newZones);
    }, []);

    // Callback when user clicks a zone
    const handleZoneSelect = useCallback((zone: Zone) => {
        setSelectedZoneId(zone.id || null);
        setSelectedObjectId(null); // Deselect object when zone selected
        setIsFollowing(false);
    }, []);

    const handleRemoveZone = useCallback(async (id: number) => {
        try {
            await api.deleteZone(id);
            setZoneRefreshTrigger(prev => prev + 1);
            if (selectedZoneId === id) setSelectedZoneId(null);
        } catch (e) {
            console.error("Failed to delete zone", e);
        }
    }, [selectedZoneId]);

    const handleClearSelection = useCallback(() => {
        setSelectedObjectId(null);
        setSelectedZoneId(null);
        setIsFollowing(false);
    }, []);

    const handleToggleFollow = useCallback(() => {
        setIsFollowing(prev => !prev);
    }, []);

    return (
        <div className="app-shell">
            <Sidebar
                objects={objects}
                zones={zones}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onSelectObject={handleObjectSelect}
                onSelectZone={handleZoneSelect}
                onAddZone={() => setDrawTrigger(prev => prev + 1)}
                onRemoveZone={handleRemoveZone}
                selectedObjectId={selectedObjectId}
                selectedZoneId={selectedZoneId}
            />
            <Overlay
                selectedObject={selectedObject}
                onCloseDetails={handleClearSelection}
                sidebarOpen={sidebarOpen}
                isFollowing={isFollowing}
                onToggleFollow={handleToggleFollow}
            />
            <MapView
                onObjectSelect={handleObjectSelect}
                onZoneSelect={handleZoneSelect}
                onObjectsUpdate={handleObjectsUpdate}
                onZonesUpdate={handleZonesUpdate}
                onClearSelection={handleClearSelection}
                selectedObjectId={selectedObjectId}
                followedObjectId={isFollowing ? selectedObjectId : null}
                selectedZoneId={selectedZoneId}
                drawTrigger={drawTrigger}
                zoneRefreshTrigger={zoneRefreshTrigger}
            />
        </div>
    );
}

export default App;
