import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Element {
  id: string;
  type: "rectangle" | "circle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Canvas = () => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addElement = (type: "rectangle" | "circle") => {
    const newElement: Element = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  return (
    <div className="flex h-screen">
      <div className="w-16 bg-card border-r border-border p-2 flex flex-col gap-2">
        <button
          onClick={() => addElement("rectangle")}
          className={cn(
            "p-2 rounded-md hover:bg-accent transition-colors",
            "flex items-center justify-center"
          )}
        >
          <Square className="w-6 h-6" />
        </button>
        <button
          onClick={() => addElement("circle")}
          className={cn(
            "p-2 rounded-md hover:bg-accent transition-colors",
            "flex items-center justify-center"
          )}
        >
          <Circle className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        <div
          ref={canvasRef}
          className="w-full h-full canvas-grid relative overflow-hidden"
        >
          <AnimatePresence>
            {elements.map((element) => (
              <motion.div
                key={element.id}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: 1,
                  x: element.x,
                  y: element.y,
                }}
                exit={{ scale: 0 }}
                drag
                dragMomentum={false}
                className={cn(
                  "absolute cursor-move",
                  selectedElement === element.id && "ring-2 ring-primary"
                )}
                style={{
                  width: element.width,
                  height: element.height,
                }}
                onClick={() => setSelectedElement(element.id)}
              >
                {element.type === "rectangle" ? (
                  <div className="w-full h-full bg-primary/20 border border-primary rounded-md" />
                ) : (
                  <div className="w-full h-full bg-primary/20 border border-primary rounded-full" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-64 bg-card border-l border-border p-4">
        <h2 className="text-lg font-semibold mb-4">Properties</h2>
        {selectedElement && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="bg-muted p-2 rounded-md"
                  value={elements.find(e => e.id === selectedElement)?.x ?? 0}
                  onChange={(e) => {
                    setElements(elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, x: parseInt(e.target.value) }
                        : el
                    ));
                  }}
                />
                <input
                  type="number"
                  className="bg-muted p-2 rounded-md"
                  value={elements.find(e => e.id === selectedElement)?.y ?? 0}
                  onChange={(e) => {
                    setElements(elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, y: parseInt(e.target.value) }
                        : el
                    ));
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Size</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  className="bg-muted p-2 rounded-md"
                  value={elements.find(e => e.id === selectedElement)?.width ?? 0}
                  onChange={(e) => {
                    setElements(elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, width: parseInt(e.target.value) }
                        : el
                    ));
                  }}
                />
                <input
                  type="number"
                  className="bg-muted p-2 rounded-md"
                  value={elements.find(e => e.id === selectedElement)?.height ?? 0}
                  onChange={(e) => {
                    setElements(elements.map(el => 
                      el.id === selectedElement 
                        ? { ...el, height: parseInt(e.target.value) }
                        : el
                    ));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};