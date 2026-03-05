import { BirthdayList } from "@/components/admin/BirthdayList";

export default function AdminBirthdaysPage() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 p-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
        お誕生日一覧
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        誕生日が登録されている会員の一覧です。月日順に表示しています。
      </p>
      <BirthdayList />
    </div>
  );
}
