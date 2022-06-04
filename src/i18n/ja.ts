import { en } from './en'

export const ja: typeof en = {
  notFound: {
    shortMessage: '見つかりませんでした',
    message: 'お探しのページが見つかりませんでした',
    goToBoardsList: 'ボード一覧へ'
  },
  boards: {
    title: '自分のボード一覧',
    loadMore: 'さらに読み込む',
    loading: '読み込み中',
    empty: 'ボードがありません',
    untitled: '無題'
  },
  menu: {
    noImageLink: 'このアクセス制限レベルのボードは画像のリンクを発行できません',
    copyImageLink: '画像のリンクをコピーする',
    copyImageLinkForMarkdown: 'Markdown用のリンクをコピーする',
    copyImageLinkForScrapbox: 'Scrapbox用のリンクをコピーする',
    aboutKakeru: 'Kakeruについて',
    experimentalFlags: '試験的な設定',
    accessibilities: {
      public: '誰でも閲覧・書き込み可能',
      protected: '誰でも閲覧でき、自分だけが書き込み可能',
      private: '自分だけが閲覧・書き込み可能'
    },
    failedToSignIn: 'ログインに失敗しました',
    myBoards: '自分のボード一覧',
    signInWithGoogle: 'Googleアカウントでログインする',
    signOut: 'ログアウト',
    turnOnInsidersVersion: 'インサイダー版を使用する',
    turnOffInsidersVersion: 'インサイダー版の使用を停止する'
  },
  toolBar: {
    title: 'タイトル'
  },
  canvas: {
    copy: 'コピー',
    paste: '貼り付け',
    delete: '削除'
  },
  global: {
    migrationConfirmation: 'ログインする前のデータを統合しますか？',
    migrationFailed: 'データの統合に失敗しました',
    migrationSucceeded: 'データの統合が完了しました',
    defaultTitle: '無題'
  },
  flags: {
    title: '試験的な設定',
    hackForSamsungGalaxyNote:
      'Galaxy Note用のハックを有効にする (Sペンを認識するための特殊な処理。ブラウザやOSのバージョンによっては動作しない可能性があります。)',
    disableSmoothingPaths: '線を滑らかにする処理を無効にする'
  },
  insiders: {
    turnOnConfirmation: `インサイダー版には開発中の機能が含まれますが、バグを含む可能性があります。
OKを選択後、ページがリロードされます。
よろしいですか？`,
    turnOffConfirmation: `インサイダー版の使用を中止してよろしいですか？
OKを選択後、ページがリロードされます。`
  }
}
