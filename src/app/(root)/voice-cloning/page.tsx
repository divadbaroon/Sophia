'use client';

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VoiceCloningPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "completed">("idle");
  const [voiceCloneResult, setVoiceCloneResult] = useState<{voice_id: string, requires_verification: boolean} | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingStatus("completed");

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus("recording");
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const downloadAudio = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-sample-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cloneVoice = async () => {
    if (!audioBlob) {
      alert("Please record audio first");
      return;
    }

    setIsCloning(true);

    try {
      // Convert blob to File for form data
      const audioFile = new File([audioBlob], `voice-sample-${Date.now()}.webm`, {
        type: "audio/webm"
      });

      // Create form data for ElevenLabs API
      const formData = new FormData();
      formData.append("name", `Voice Clone ${new Date().toLocaleDateString()}`);
      formData.append("files", audioFile);
      formData.append("remove_background_noise", "true");
      formData.append("description", "Voice clone created from web recording");

      // Make API request to ElevenLabs
      const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: {
          "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || ""
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      
      // Store the result
      setVoiceCloneResult(result);
      
      console.log("Voice created successfully:", result);
      
    } catch (error) {
      console.error("Error cloning voice:", error);
 
    } finally {
      setIsCloning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm mt-20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Voice Cloning Studio</h1>
              <p className="text-sm text-gray-500">
                Record a sample of your voice to create a personalized AI voice clone using ElevenLabs technology.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-6 relative min-h-[500px]">
            {/* Instructions Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Recording Instructions</h3>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    For best results, record in a quiet environment and speak clearly for at least 30 seconds. The
                    longer and clearer your sample, the better your AI voice clone will sound.
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Prompt Card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">Sample Prompt - Office Hours Scenario</h3>
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      &ldquo;Hi Alex, I&rsquo;m glad you stopped by during office hours. I can see you&rsquo;re having trouble with binary
                      tree traversals in your data structures assignment. Let me help you understand the difference
                      between inorder, preorder, and postorder traversal. Think of it this way: imagine you&rsquo;re visiting
                      every node in the tree, but the order matters. In preorder, you visit the root first, then the
                      left subtree, then the right subtree. It&rsquo;s like reading a book from top to bottom, left to right.
                      For your assignment, try implementing the recursive approach first - it&rsquo;s more intuitive.
                      Remember, each node has at most two children, and the recursive calls handle the subtrees
                      automatically. Don&rsquo;t worry if it seems complex at first, binary trees are tricky for everyone
                      initially, but once it clicks, you&rsquo;ll find them quite elegant.&rdquo;
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    💡 Read this prompt naturally and conversationally when recording your voice sample.
                  </p>
                </div>
              </div>
            </div>

            {/* Recording Section */}
            <div className="flex flex-col items-center space-y-6">
              {/* Record Button */}
              <div className="relative">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center text-white font-medium
                    transition-all duration-200 hover:shadow-lg
                    ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-900 hover:bg-gray-800"}
                  `}
                >
                  {isRecording ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </Button>

                {/* Recording Timer */}
                {isRecording && (
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              {audioUrl && (
                <div className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recorded Audio</h3>
                    <span className="text-xs text-gray-500 font-medium">{formatTime(recordingTime)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={togglePlayback}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      {isPlaying ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                          </svg>
                          Pause
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 010 5H9m-4-5v5a4 4 0 01-4-4 4 4 0 014-4zm.172 1.172a4 4 0 015.656 0" />
                          </svg>
                          Play
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={downloadAudio}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {/* Voice Clone Success Card */}
              {voiceCloneResult && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">Voice Successfully Cloned!</h3>
                      <div className="space-y-2">
                        <div className="bg-white border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Voice ID</p>
                          <p className="text-sm font-mono text-gray-800 break-all">{voiceCloneResult.voice_id}</p>
                        </div>
                        {voiceCloneResult.requires_verification && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">⚠️ Voice requires verification before use</p>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => navigator.clipboard.writeText(voiceCloneResult.voice_id)}
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs"
                      >
                        Copy Voice ID
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clone Voice Button */}
              {recordingStatus === "completed" && !voiceCloneResult && (
                <Button
                  onClick={cloneVoice}
                  disabled={!audioBlob || isCloning}
                  className={`px-8 py-4 text-white font-medium transition-all duration-200 ${
                    audioBlob && !isCloning ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isCloning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Voice Clone...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clone Voice
                    </div>
                  )}
                </Button>
              )}

              {/* Initial State Message */}
              {recordingStatus === "idle" && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Click the microphone to start recording</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hidden audio element for playback */}
        {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />}
      </div>
    </div>
  );
}