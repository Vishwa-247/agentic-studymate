import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Circle } from "lucide-react";
import { useRef, useEffect } from "react";

interface TranscriptionDisplayProps {
	text: string;
	interimText?: string;
	isRecording: boolean;
}

const TranscriptionDisplay = ({ text, interimText, isRecording }: TranscriptionDisplayProps) => {
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text?.length || 0;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when text updates
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [text, interimText]);

    return (
        <Card className="h-96">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Live Transcription
                    {isRecording && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-2.5rem)]">
                <div ref={scrollRef} className="flex-1 overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 rounded p-2">
                    {text ? text : (isRecording ? "Listening... start speaking" : "Start recording to see transcription")}
                    {interimText && (
                      <span className="text-muted-foreground italic"> {interimText}</span>
                    )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                    <span>Words: {words}</span>
                    <span>Characters: {chars}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default TranscriptionDisplay;
