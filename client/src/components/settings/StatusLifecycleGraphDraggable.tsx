import React, { useState, useRef, useCallback, useEffect } from "react";
import { useStatusTransitions, TaskStatus } from "@/hooks/useTaskStatuses";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';


const StatusLifecycleGraphDraggable: React.FC<{ statuses: TaskStatus[] }> = ({ statuses }) => {
  const { transitions, setTransitions } = useStatusTransitions();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { user } = useAuth();
  
  
  // Drag and drop state
  const [statusPositions, setStatusPositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load saved positions from localStorage
  const loadSavedPositions = useCallback(() => {
    try {
      const saved = localStorage.getItem('statusLifecyclePositions');
      if (saved) {
        const positions = JSON.parse(saved);
        const positionMap = new Map<string, {x: number, y: number}>();
        Object.entries(positions).forEach(([statusName, pos]: [string, any]) => {
          positionMap.set(statusName, pos);
        });
        setStatusPositions(positionMap);
        return true;
      }
    } catch (error) {
      console.error('Failed to load saved positions:', error);
    }
    return false;
  }, []);

  // Save positions to localStorage
  const savePositions = () => {
    try {
      const positionsObj: Record<string, {x: number, y: number}> = {};
      statusPositions.forEach((pos, statusName) => {
        positionsObj[statusName] = pos;
      });
      localStorage.setItem('statusLifecyclePositions', JSON.stringify(positionsObj));
      setHasUnsavedChanges(false);
      toast({ title: "Status positions saved successfully!" });
    } catch (error) {
      console.error('Failed to save positions:', error);
      toast({ title: "Error", description: "Failed to save positions" });
    }
  };

 // StatusLifecycleGraphDraggable.tsx
const createTransition = async () => {
  
    if (!from || !to || from === to) {
        toast({ title: "Please select different statuses." });
        return;
    }
    
    const fromStatus = statuses.find(s => s.id === from);
    const toStatus = statuses.find(s => s.id === to);
    
    if (!fromStatus || !toStatus) {
        toast({ title: "Invalid status selection." });
        return;
    }
    
    if (transitions.find((t) => t.from_status === fromStatus.name && t.to_status === toStatus.name)) {
        toast({ title: "Transition already exists." });
        return;
    }
    
    // START: ADDING PERSISTENCE LOGIC
    try {
        const payload = {
            from_status: fromStatus.name,
            to_status: toStatus.name
        };

        const response = await fetch('/api/task-status-transitions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user?.id || '' 
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            // Assuming the API returns the newly created transition object
            const newTransition = await response.json(); 
            
            // Update local state with the persisted object
            setTransitions([...transitions, newTransition]);
            
            toast({ title: "Status transition added successfully!" });
        } else {
            const errorData = await response.json();
            toast({ title: "Failed to add transition", description: errorData.message || "Server error.", variant: "destructive" });
        }
    } catch (error) {
        console.error('Error adding transition:', error);
        toast({ title: "Error adding transition", description: "Network or unexpected error.", variant: "destructive" });
    }
    // END: ADDING PERSISTENCE LOGIC
    
    setFrom("");
    setTo("");
};

// StatusLifecycleGraphDraggable.tsx
const deleteTransition = async (transitionId: string) => {
    // START: ADDING PERSISTENCE LOGIC
    try {
        const response = await fetch(`/api/task-status-transitions/${transitionId}`, {
            method: 'DELETE',
            headers: {
                'x-user-id': (window as any).currentUser?.id || ''
            }
        });
        
        if (response.ok) {
            // Update local state only after successful API call
            setTransitions(transitions.filter(t => t.id !== transitionId)); 
            toast({ title: "Transition removed." });
        } else {
            const errorData = await response.json();
            toast({ title: "Failed to remove transition", description: errorData.message || "Server error.", variant: "destructive" });
        }
    } catch (error) {
        console.error('Error removing transition:', error);
        toast({ title: "Error removing transition", description: "Network or unexpected error.", variant: "destructive" });
    }
    // END: ADDING PERSISTENCE LOGIC
};
  
  // Initialize positions if not set
  const initializePositions = useCallback(() => {
    if (statusPositions.size === 0 && statuses.length > 0) {
      // Try to load saved positions first
      if (!loadSavedPositions()) {
        // If no saved positions, create default layout
        const newPositions = new Map<string, {x: number, y: number}>();
        statuses.forEach((status, idx) => {
          newPositions.set(status.name, {
            x: 150 + idx * 180,
            y: 250
          });
        });
        setStatusPositions(newPositions);
      }
    }
  }, [statuses, statusPositions.size, loadSavedPositions]);
  
  // Initialize positions on component mount
  useEffect(() => {
    initializePositions();
  }, [initializePositions]);
  
  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, statusName: string) => {
    e.preventDefault();
    setIsDragging(statusName);
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const currentPos = statusPositions.get(statusName);
      if (currentPos) {
        setDragOffset({
          x: e.clientX - rect.left - currentPos.x,
          y: e.clientY - rect.top - currentPos.y
        });
      }
    }
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setStatusPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(isDragging, { x: newX, y: newY });
      return newPositions;
    });
    setHasUnsavedChanges(true);
  }, [isDragging, dragOffset]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);
  
  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const nodeRadius = 50;
  const svgWidth = 1200;
  const svgHeight = 600;

  const wrapText = (text: string, maxChars: number) => {
    if (text.length <= maxChars) return [text];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxChars ? word.substring(0, maxChars - 3) + '...' : word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 2);
  };

  return (
    <div className="w-full bg-white border rounded-lg p-6 shadow-sm">
      <h4 className="font-semibold mb-4 text-lg">Status Lifecycle (Drag & Drop)</h4>
      <p className="text-sm text-gray-600 mb-4">
        Drag the status circles to arrange them as you like. Transition arrows will follow automatically.
      </p>
      
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
        <select
          className="border px-3 py-2 bg-background rounded-md shadow-sm min-w-[150px]"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="">Select From Status</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        
        <span className="flex items-center text-gray-500">→</span>
        
        <select
          className="border px-3 py-2 bg-background rounded-md shadow-sm min-w-[150px]"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          <option value="">Select To Status</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
        
        <Button
          onClick={createTransition}
          disabled={!from || !to || from === to}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
        >
          Add Transition
        </Button>
        
        <div className="flex gap-2 items-center ml-auto">
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600 font-medium">
              ● Unsaved changes
            </span>
          )}
          <Button
            onClick={savePositions}
            disabled={!hasUnsavedChanges}
            variant={hasUnsavedChanges ? "default" : "outline"}
            className={hasUnsavedChanges ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {hasUnsavedChanges ? "Save Layout" : "Layout Saved"}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <svg
          ref={svgRef}
          width={svgWidth}
          height={svgHeight}
          className="w-full h-auto bg-gradient-to-br from-blue-50 to-white"
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#4b5563"
                stroke="#4b5563"
                strokeWidth="1"
              />
            </marker>
            
            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Render transitions */}
      {/* Render transitions */}
{transitions.map((tr) => {
  const fromPos = statusPositions.get(tr.from_status);
  const toPos = statusPositions.get(tr.to_status);
  
  if (!fromPos || !toPos) return null;

  // Check if there is a reverse transition (Bidirectional)
  const isBidirectional = transitions.some(
    (t) => t.from_status === tr.to_status && t.to_status === tr.from_status
  );

  let pathD = "";
  let labelX = 0;
  let labelY = 0;
  
  // Basic vector math
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  
  if (isBidirectional) {
    // === CURVED LINE LOGIC ===
    
    // Calculate the midpoint between the two nodes
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;

    // Calculate a normal vector (perpendicular to the line)
    // We normalize it and multiply by a curvature factor (e.g., 50px)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = 60; // How "bent" the curve is
    
    // Normal vector logic: (-dy, dx) gives a perpendicular vector
    const offsetX = (-dy / distance) * curvature;
    const offsetY = (dx / distance) * curvature;

    // The Control Point for the Bezier Curve
    const cpX = midX + offsetX;
    const cpY = midY + offsetY;

    // Recalculate start/end points on the circle circumference 
    // based on the angle to the CONTROL POINT, not the destination node.
    // This makes the arrow come out of the circle cleanly.
    const angleFrom = Math.atan2(cpY - fromPos.y, cpX - fromPos.x);
    const angleTo = Math.atan2(cpY - toPos.y, cpX - toPos.x);

    const startX = fromPos.x + Math.cos(angleFrom) * nodeRadius;
    const startY = fromPos.y + Math.sin(angleFrom) * nodeRadius;
    
    const endX = toPos.x + Math.cos(angleTo) * nodeRadius;
    const endY = toPos.y + Math.sin(angleTo) * nodeRadius;

    // Quadratic Bezier Curve (M = Move, Q = Quadratic Curve to endpoint using control point)
    pathD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
    
    // Position the X button near the peak of the curve (approx at t=0.5)
    // Bezier formula for t=0.5 simplifies to: 0.25*P0 + 0.5*P1 + 0.25*P2
    // But geometrically, it's roughly the midpoint between the chord mid and the control point
    labelX = (midX + cpX) / 2;
    labelY = (midY + cpY) / 2;

  } else {
    // === STRAIGHT LINE LOGIC (Existing) ===
    
    // Calculate angle directly to the target
    const angle = Math.atan2(dy, dx);
    
    const startX = fromPos.x + Math.cos(angle) * nodeRadius;
    const startY = fromPos.y + Math.sin(angle) * nodeRadius;
    
    const endX = toPos.x - Math.cos(angle) * nodeRadius;
    const endY = toPos.y - Math.sin(angle) * nodeRadius;

    pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
    
    labelX = (startX + endX) / 2;
    labelY = (startY + endY) / 2;
  }

  return (
    <g key={tr.id}>
      <path
        d={pathD}
        stroke="#4b5563"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        opacity="0.8"
      />
      
      <foreignObject 
        x={labelX - 12} 
        y={labelY - 12} 
        width="24" 
        height="24"
      >
        <Button
          variant="ghost"
          size="sm"
          className="!w-6 !h-6 !p-0 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-200 shadow-sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag start when clicking delete
            deleteTransition(tr.id);
          }}
          title="Remove transition"
        >
          ✕
        </Button>
      </foreignObject>
    </g>
  );
})}
          
          {/* Render status nodes */}
          {Array.from(statusPositions.entries()).map(([statusName, pos]) => {
            const status = statuses.find(s => s.name === statusName);
            if (!status) return null;
            
            const textLines = wrapText(status.name, 10);
            const isBeingDragged = isDragging === statusName;
            
            return (
              <g 
                key={status.id}
                style={{ cursor: isBeingDragged ? 'grabbing' : 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, statusName)}
              >
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r={nodeRadius} 
                  fill="url(#nodeGradient)" 
                  stroke={isBeingDragged ? "#3b82f6" : "#64748b"}
                  strokeWidth={isBeingDragged ? "3" : "2"}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                  opacity={isBeingDragged ? 0.8 : 1}
                />
                
                {textLines.map((line, lineIdx) => (
                  <text 
                    key={lineIdx}
                    x={pos.x} 
                    y={pos.y + (lineIdx - (textLines.length - 1) / 2) * 14} 
                    textAnchor="middle" 
                    fontSize="12" 
                    fill="#1e293b"
                    fontWeight="500"
                    pointerEvents="none"
                  >
                    {line}
                  </text>
                ))}
                
                <text 
                  x={pos.x} 
                  y={pos.y + nodeRadius + 20} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="#64748b"
                  pointerEvents="none"
                >
                  #{statuses.indexOf(status) + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {transitions.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          No transitions created yet. Add transitions between statuses using the controls above.
        </p>
      )}
    </div>
  );
};

export default StatusLifecycleGraphDraggable;