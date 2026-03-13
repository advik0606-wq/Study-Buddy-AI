import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  FileText, 
  Brain, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw,
  Upload,
  Loader2,
  Sparkles,
  File as FileIcon,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { generateStudyMaterial, type StudyMaterial, type QuizQuestion, type Flashcard, type FileData } from './services/gemini';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">StudyBuddy AI</span>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('home')}
            className={cn(
              "text-sm font-medium transition-colors",
              activeTab === 'home' ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveTab('contact')}
            className={cn(
              "text-sm font-medium transition-colors",
              activeTab === 'contact' ? "text-indigo-600" : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const FlashcardComponent = ({ card }: { card: Flashcard }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="perspective-1000 w-full h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full transition-all duration-500 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-white border-2 border-indigo-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4">Question</span>
          <p className="text-lg font-medium text-zinc-800">{card.front}</p>
          <div className="mt-auto text-xs text-zinc-400">Click to flip</div>
        </div>
        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg text-white"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-4">Answer</span>
          <p className="text-lg font-medium">{card.back}</p>
          <div className="mt-auto text-xs text-indigo-200">Click to flip back</div>
        </div>
      </motion.div>
    </div>
  );
};

const QuizComponent = ({ questions }: { questions: QuizQuestion[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-xl border border-zinc-100 max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Quiz Completed!</h2>
        <p className="text-zinc-500 mb-6">You scored {score} out of {questions.length}</p>
        <div className="text-4xl font-black text-indigo-600 mb-8">
          {Math.round((score / questions.length) * 100)}%
        </div>
        <button 
          onClick={() => {
            setCurrentIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedAnswer(null);
            setShowExplanation(false);
          }}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Question {currentIndex + 1} of {questions.length}</span>
          <h2 className="text-xl font-semibold text-zinc-900 mt-1">{q.question}</h2>
        </div>
      </div>

      <div className="space-y-3">
        {q.options.map((option, idx) => {
          const isCorrect = option === q.correctAnswer;
          const isSelected = option === selectedAnswer;
          
          return (
            <button
              key={idx}
              disabled={!!selectedAnswer}
              onClick={() => handleAnswer(option)}
              className={cn(
                "w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between",
                !selectedAnswer && "border-zinc-100 hover:border-indigo-200 hover:bg-indigo-50/30",
                selectedAnswer && isCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                selectedAnswer && isSelected && !isCorrect && "border-rose-500 bg-rose-50 text-rose-900",
                selectedAnswer && !isSelected && !isCorrect && "border-zinc-100 opacity-50"
              )}
            >
              <span className="font-medium">{option}</span>
              {selectedAnswer && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {selectedAnswer && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100"
          >
            <p className="text-sm text-indigo-900">
              <span className="font-bold">Explanation:</span> {q.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex justify-end">
        <button
          disabled={!selectedAnswer}
          onClick={nextQuestion}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ContactPage = () => (
  <div className="max-w-2xl mx-auto py-12 px-4">
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-zinc-900 mb-4">Contact Us</h1>
      <p className="text-zinc-500">Have questions or feedback? We'd love to hear from you.</p>
    </div>
    
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-zinc-100">
      <form action="https://formspree.io/f/mnjgvryd" method="POST" className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Full Name</label>
            <input 
              type="text" 
              name="name"
              required
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="john@example.com"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Subject</label>
          <input 
            type="text" 
            name="subject"
            required
            placeholder="How can we help?"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Message</label>
          <textarea 
            name="message"
            required
            rows={4}
            placeholder="Your message here..."
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          ></textarea>
        </div>
        <button 
          type="submit"
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Send className="w-5 h-5" /> Send Message
        </button>
      </form>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ file: File, data: string, mimeType: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [studyMaterial, setStudyMaterial] = useState<StudyMaterial | null>(null);
  const [viewMode, setViewMode] = useState<'quiz' | 'flashcards'>('quiz');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      setSelectedFile({
        file,
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!inputText.trim() && !selectedFile) return;
    
    setIsGenerating(true);
    try {
      const fileData: FileData | undefined = selectedFile ? {
        data: selectedFile.data,
        mimeType: selectedFile.mimeType
      } : undefined;

      const material = await generateStudyMaterial(inputText, fileData);
      setStudyMaterial(material);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pt-16">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {!studyMaterial ? (
                <div className="max-w-3xl mx-auto text-center space-y-8">
                  <div className="space-y-4">
                    <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl">
                      Turn your notes into <span className="text-indigo-600">Mastery</span>
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
                      Upload your study materials, notebook work, or class topics. Our AI generates interactive quizzes and flashcards instantly.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-8 shadow-xl border border-zinc-100 space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Add topics, instructions, or paste text here..."
                          className="w-full h-32 p-6 rounded-2xl border-2 border-zinc-100 focus:border-indigo-500 focus:outline-none transition-all resize-none text-lg"
                        />
                      </div>

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                          selectedFile ? "border-indigo-500 bg-indigo-50/30" : "border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50"
                        )}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden" 
                          accept="*/*"
                        />
                        
                        {selectedFile ? (
                          <div className="flex items-center gap-4 w-full">
                            <div className="bg-indigo-600 p-3 rounded-xl">
                              {selectedFile.file.type.startsWith('image/') ? (
                                <ImageIcon className="w-6 h-6 text-white" />
                              ) : (
                                <FileIcon className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-bold text-zinc-900 truncate max-w-[200px]">{selectedFile.file.name}</p>
                              <p className="text-xs text-zinc-500">{(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                              }}
                              className="p-2 hover:bg-rose-100 rounded-full text-rose-500 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="bg-zinc-100 p-4 rounded-full">
                              <Upload className="w-8 h-8 text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900">Click to upload file</p>
                              <p className="text-sm text-zinc-500">PDF, Images, Word, or any study material</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || (!inputText.trim() && !selectedFile)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-indigo-200"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" /> Analyzing & Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" /> Generate Quiz & Flashcards
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                    {[
                      { icon: FileText, title: "Any Document", desc: "Notes, PDFs, or plain text" },
                      { icon: Brain, title: "AI Powered", desc: "Smart question generation" },
                      { icon: BookOpen, title: "Two Modes", desc: "Quizzes and Flashcards" }
                    ].map((feature, i) => (
                      <div key={i} className="p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm text-center">
                        <feature.icon className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
                        <h3 className="font-bold text-zinc-900">{feature.title}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button 
                      onClick={() => setStudyMaterial(null)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Input
                    </button>
                    
                    <div className="bg-white p-1 rounded-xl border border-zinc-200 flex shadow-sm">
                      <button 
                        onClick={() => setViewMode('quiz')}
                        className={cn(
                          "px-6 py-2 rounded-lg font-semibold transition-all",
                          viewMode === 'quiz' ? "bg-indigo-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-900"
                        )}
                      >
                        Quiz Mode
                      </button>
                      <button 
                        onClick={() => setViewMode('flashcards')}
                        className={cn(
                          "px-6 py-2 rounded-lg font-semibold transition-all",
                          viewMode === 'flashcards' ? "bg-indigo-600 text-white shadow-md" : "text-zinc-500 hover:text-zinc-900"
                        )}
                      >
                        Flashcards
                      </button>
                    </div>
                  </div>

                  <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-xl border border-zinc-100 min-h-[500px]"
                  >
                    {viewMode === 'quiz' ? (
                      <QuizComponent questions={studyMaterial.quiz} />
                    ) : (
                      <div className="max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 gap-6">
                          {studyMaterial.flashcards.map((card, i) => (
                            <FlashcardComponent key={i} card={card} />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ContactPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-zinc-200 py-12 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-indigo-600" />
            <span className="text-lg font-bold">StudyBuddy AI</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 StudyBuddy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

