import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-lg font-bold">ページが見つかりません</p>
      <Link href="/" className="btn-primary mt-6">ホームへ</Link>
    </div>
  )
}
