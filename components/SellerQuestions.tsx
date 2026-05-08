import { MessageSquareText } from "lucide-react";

export function SellerQuestions({ questions }: { questions: string[] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <MessageSquareText className="mt-1 h-5 w-5 text-mint" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-mint">Seller question generator</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">Ask before you drive there</h2>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        <li className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
          Why are you selling it?
        </li>
        <li className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
          Are there any issues I should know about?
        </li>
        <li className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-700">
          Can you send a video of it working?
        </li>
        {questions.map((question) => (
          <li
            key={question}
            className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-sm leading-6 text-stone-700"
          >
            {question}
          </li>
        ))}
      </ul>
    </section>
  );
}
