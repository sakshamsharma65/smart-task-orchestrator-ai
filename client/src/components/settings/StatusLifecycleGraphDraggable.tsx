import React, { useState, useRef, useCallback, useEffect } from "react";
import { useStatusTransitions, TaskStatus } from "@/hooks/useTaskStatuses";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

// Helper to handle dirty API strings (spaces and casing)
const normalize = (str: string) => str?.trim().toLowerCase() || "";

const StatusLifecycleGraphDraggable: React.FC<{ statuses: TaskStatus[] }> = ({ statuses }) => {
  const { transitions, setTransitions } = useStatusTransitions();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { user } = useAuth();
  
  const [statusPositions, setStatusPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // --- 1. ROBUST POSITION LOOKUP ---
  // This finds the position even if the API name has extra spaces
  const getPositionForStatus = useCallback((statusName: string) => {
    // Try exact match first
    if (statusPositions.has(statusName)) return statusPositions.get(statusName);
    
    // Try normalized match (finds "Arrival " in a map containing "Arrival")
    const normalizedTarget = normalize(statusName);
    const entry = Array.from(statusPositions.entries()).find(
      ([key]) => normalize(key) === normalizedTarget
    );
    return entry ? entry[1] : null;
  }, [statusPositions]);

  // --- 2. DYNAMIC INITIALIZATION ---
  // Ensure EVERY status from props gets a position on screen
  useEffect(() => {
    if (statuses.length === 0) return;

    setStatusPositions(prev => {
      const newMap = new Map(prev);
      let updated = false;

      statuses.forEach((status) => {
        // If this status isn't in our coordinate map yet, add it
        if (!newMap.has(status.name)) {
          newMap.set(status.name, {
            x: 150 + (newMap.size * 180) % 900, 
            y: 200 + (Math.floor(newMap.size / 5) * 120)
          });
          updated = true;
        }
      });

      return updated ? newMap : prev;
    });
  }, [statuses]);

  // Load/Save logic
  const loadSavedPositions = useCallback(() => {
    try {
      const saved = localStorage.getItem('statusLifecyclePositions');
      if (saved) {
        const positions = JSON.parse(saved);
        const positionMap = new Map<string, {x: number, y: number}>();
        Object.entries(positions).forEach(([name, pos]: [string, any]) => positionMap.set(name, pos));
        setStatusPositions(positionMap);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  }, []);

  useEffect(() => { loadSavedPositions(); }, [loadSavedPositions]);

  const savePositions = () => {
    const positionsObj: Record<string, any> = {};
    statusPositions.forEach((pos, name) => { positionsObj[name] = pos; });
    localStorage.setItem('statusLifecyclePositions', JSON.stringify(positionsObj));
    setHasUnsavedChanges(false);
    toast({ title: "Layout Saved!" });
  };

  // API Handlers
  const createTransition = async () => {
    const fromStatus = statuses.find(s => s.id === from);
    const toStatus = statuses.find(s => s.id === to);
    if (!fromStatus || !toStatus) return;

    try {
      const response = await fetch('/api/task-status-transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify({ from_status: fromStatus.name, to_status: toStatus.name })
      });
      if (response.ok) {
        const newTr = await response.json();
        setTransitions([...transitions, newTr]);
        setFrom(""); setTo("");
        toast({ title: "Transition Added" });
      }
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const deleteTransition = async (id: string) => {
    try {
      const response = await fetch(`/api/task-status-transitions/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' }
      });
      if (response.ok) {
        setTransitions(transitions.filter(t => t.id !== id));
        toast({ title: "Removed" });
      }
    } catch (e) { /* handle error */ }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setIsDragging(name);
    const rect = svgRef.current?.getBoundingClientRect();
    const pos = statusPositions.get(name);
    if (rect && pos) {
      setDragOffset({ x: e.clientX - rect.left - pos.x, y: e.clientY - rect.top - pos.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setStatusPositions(prev => {
      const next = new Map(prev);
      next.set(isDragging, { 
        x: e.clientX - rect.left - dragOffset.x, 
        y: e.clientY - rect.top - dragOffset.y 
      });
      return next;
    });
    setHasUnsavedChanges(true);
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => setIsDragging(null), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const nodeRadius = 50;

  return (
    <div className="w-full bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-semibold text-lg">Status Lifecycle</h4>
        <Button onClick={savePositions} disabled={!hasUnsavedChanges} variant={hasUnsavedChanges ? "default" : "outline"}>
          {hasUnsavedChanges ? "Save Layout" : "Layout Saved"}
        </Button>
      </div>

      <div className="flex gap-3 mb-6 p-4 bg-slate-50 rounded-md">
        <select value={from} onChange={e => setFrom(e.target.value)} className="border p-2 rounded w-48">
          <option value="">From...</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="py-2">→</span>
        <select value={to} onChange={e => setTo(e.target.value)} className="border p-2 rounded w-48">
          <option value="">To...</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Button onClick={createTransition} disabled={!from || !to}>Add Transition</Button>
      </div>

      <div className="border rounded-lg bg-slate-50 overflow-hidden">
        <svg ref={svgRef} width={1200} height={600} className="w-full h-auto">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
            </marker>
          </defs>

          {/* Render Transitions using Fuzzy Lookup */}
          {transitions.map((tr) => {
            const fromPos = getPositionForStatus(tr.from_status);
            const toPos = getPositionForStatus(tr.to_status);
            
            if (!fromPos || !toPos) return null;

            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const angle = Math.atan2(dy, dx);
            
            const startX = fromPos.x + Math.cos(angle) * nodeRadius;
            const startY = fromPos.y + Math.sin(angle) * nodeRadius;
            const endX = toPos.x - Math.cos(angle) * nodeRadius;
            const endY = toPos.y - Math.sin(angle) * nodeRadius;

            return (
              <g key={tr.id}>
                <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#4b5563" strokeWidth="2" markerEnd="url(#arrowhead)" opacity="0.6" />
                <circle cx={(startX + endX) / 2} cy={(startY + endY) / 2} r="10" fill="white" stroke="#fee2e2" />
                <text 
                  x={(startX + endX) / 2} y={(startY + endY) / 2 + 4} 
                  textAnchor="middle" fontSize="10" fill="#ef4444" className="cursor-pointer"
                  onClick={() => deleteTransition(tr.id)}
                >✕</text>
              </g>
            );
          })}

          {/* Render Status Nodes */}
          {statuses.map((status) => {
            const pos = statusPositions.get(status.name);
            if (!pos) return null;
            const isDraggingThis = isDragging === status.name;

            return (
              <g key={status.id} onMouseDown={(e) => handleMouseDown(e, status.name)} className="cursor-grab active:cursor-grabbing">
                <circle cx={pos.x} cy={pos.y} r={nodeRadius} fill="white" stroke={isDraggingThis ? "#3b82f6" : "#64748b"} strokeWidth="2" shadow="sm" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e293b">{status.name}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default StatusLifecycleGraphDraggable;