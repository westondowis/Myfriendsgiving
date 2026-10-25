import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Calendar, MapPin, FileText, Share2, ChefHat } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateFeastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFeast: (meta: {
    title: string;
    eventDate?: string;
    location?: string;
    notes?: string;
  }) => string | Promise<string>;
  onShowToast: (msg: string, icon?: string) => void;
}

export const CreateFeastModal: React.FC<CreateFeastModalProps> = ({
  isOpen,
  onClose,
  onCreateFeast,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('Thursday, November 26 · 4:00 PM');
  const [location, setLocation] = useState('3295 Eliot st, United States');
  const [notes, setNotes] = useState('Hot dishes ready by 4:30 PM. BYOB & bring your holiday cheer!');
  const [createdPotluckId, setCreatedPotluckId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please enter a feast title!', '⚠️');
      return;
    }

    try {
      setIsSubmitting(true);
      const newId = await onCreateFeast({
        title: title.trim(),
        eventDate: eventDate.trim(),
        location: location.trim(),
        notes: notes.trim(),
      });
      setCreatedPotluckId(newId);

      if (typeof confetti === 'function') {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#C25927', '#D4952B', '#526650', '#8C3A27', '#FAF6F0'],
        });
      }

      onShowToast(`"${title.trim()}" created! Ready to invite friends.`, '🎉');
    } catch (err: any) {
      onShowToast('Could not create feast: ' + (err?.message || 'Error'), '⚠️');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getShareLink = () => {
    if (!createdPotluckId) return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?potluck=${encodeURIComponent(createdPotluckId)}`;
  };

  const handleCopyLink = () => {
    const link = getShareLink();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onShowToast('Guest invite link copied!', '📋');
    } else {
      window.prompt('Copy this link:', link);
    }
  };

  const handleFinish = () => {
    setCreatedPotluckId(null);
    setTitle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C1E16]/60 backdrop-blur-xs transition-opacity no-print"
      onClick={handleFinish}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-[#E8DEC8] shadow-warmLg space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#526650] block">
              Host Feast Creator
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C1E16] leading-snug">
              {createdPotluckId ? 'Feast Ready to Share!' : 'Create a New Feast'}
            </h3>
          </div>
          <button
            onClick={handleFinish}
            className="p-1.5 rounded-full text-[#8C7A6E] hover:text-[#2C1E16] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!createdPotluckId ? (
          /* Event Details Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#705F55] leading-relaxed">
              Set up your gathering below. We will populate a fresh feast ledger with standard holiday staples, ready for your guests to claim with <strong>zero login required</strong>!
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1">
                Feast / Potluck Title <span className="text-[#8C3A27]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Downtown Friendsgiving 2026"
                className="w-full border border-[#D9CEBF] p-2.5 rounded-xl text-sm bg-[#FAF8F5] text-[#2C1E16] focus:outline-none focus:ring-2 focus:ring-[#8C3A27] font-medium"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C25927]" />
                <span>Date & Time</span>
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g., Thursday, Nov 26 · 4:00 PM"
                className="w-full border border-[#D9CEBF] p-2.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C1E16] focus:outline-none focus:ring-2 focus:ring-[#8C3A27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C25927]" />
                <span>Venue Address / Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 3295 Eliot st, United States"
                className="w-full border border-[#D9CEBF] p-2.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C1E16] focus:outline-none focus:ring-2 focus:ring-[#8C3A27]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#C25927]" />
                <span>Host Welcome Note</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g., Bring your favorite seasonal drinks! Hot food served at 4:30."
                className="w-full border border-[#D9CEBF] p-2.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C1E16] focus:outline-none focus:ring-2 focus:ring-[#8C3A27]"
              />
            </div>

            <div className="p-3 bg-[#FAF4ED] rounded-xl border border-[#EADBCC] flex items-center gap-2.5 text-xs text-[#705F55]">
              <ChefHat className="w-4 h-4 text-[#C25927] shrink-0" />
              <span>Standard Thanksgiving staples (Turkey, Gravy, Stuffing, Pies) will be automatically initialized!</span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-1/3 py-2.5 rounded-xl border border-[#D9CEBF] text-[#705F55] text-xs font-semibold hover:bg-[#F3EDE2] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 bg-[#8C3A27] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#732E1E] transition shadow-xs flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Feast 🦃</span>
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen with Copyable Share Link */
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
              <div className="text-2xl">🍁</div>
              <h4 className="font-bold text-sm text-[#2C1E16]">"{title}" is Live!</h4>
              <p className="text-xs text-[#526650]">
                Your ledger has been loaded with staples. Send this link to your group:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A3B32] mb-1">
                Guest Invite Link (Zero Login Required)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareLink()}
                  className="flex-1 border border-[#D9CEBF] p-2.5 rounded-xl text-xs bg-[#FAF8F5] text-[#2C1E16] font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#8C3A27] hover:bg-[#732E1E] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full bg-[#2C1E16] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#4A3B32] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Go to Feast Ledger 🍂</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
