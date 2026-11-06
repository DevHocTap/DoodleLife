import { useEffect, useState } from 'react';

export default function App() {
  const [apiStatus, setApiStatus] = useState<string>('Đang kiểm tra API…');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d: { ok?: boolean; provider?: string }) =>
        setApiStatus(d.ok ? `API đang chạy (provider: ${d.provider ?? '?'})` : 'API trả lỗi'),
      )
      .catch(() => setApiStatus('Chưa kết nối được API (chạy npm run dev ở apps/api)'));
  }, []);

  return (
    <main className="min-h-screen bg-[#FFF6E5] text-[#2D2A32]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-4xl font-bold">DoodleLife</h1>
        <p className="mt-2 text-lg">Nền tảng nhật ký trực quan tích hợp AI</p>
        <p className="mt-6">
          Viết một đoạn nhật ký ngắn — AI vẽ thành sticker doodle và xếp lên dòng
          thời gian của bạn.
        </p>
        <div className="mt-8 rounded-xl border-2 border-[#2D2A32] bg-white p-4">
          <p className="font-semibold">Trạng thái Sprint 1</p>
          <p className="mt-1 text-sm">{apiStatus}</p>
          <p className="mt-1 text-sm">
            Luồng nhật ký → sticker đang được xây dựng (C01–C05). Trang này là
            scaffold tối thiểu, sẽ nối form viết nhật ký và timeline ở bước sau.
          </p>
        </div>
      </div>
    </main>
  );
}
