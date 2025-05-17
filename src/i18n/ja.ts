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
    untitled: '無題',
    deleteBoard: '削除する',
    deleteConfirmation: 'ボードを削除してよろしいですか？',
    failedToDelete: 'ボードの削除に失敗しました',
    new: '新しく作る'
  },
  menu: {
    noImageLink: 'このアクセス制限レベルのボードは画像のリンクを発行できません',
    copyImageLink: '画像のリンクをコピーする',
    copyImageLinkForMarkdown: 'Markdown用のリンクをコピーする',
    copyImageLinkForScrapbox: 'Scrapbox用のリンクをコピーする',
    shareOrExport: 'シェア / エクスポート',
    aboutKakeru: 'Kakeruについて',
    experimentalFlags: '試験的な設定',
    accessibilities: {
      public: '誰でも閲覧・書き込み可能',
      protected: '誰でも閲覧でき、自分だけが書き込み可能',
      private: '自分だけが閲覧・書き込み可能'
    },
    failedToSignIn: 'ログインに失敗しました',
    myBoards: '自分のボード一覧',
    signInAnonymously: 'ゲストとして利用する',
    usingAnonymously: 'ゲストとして利用中です',
    signInWithGoogle: 'Googleアカウントでログインする',
    signOut: 'ログアウト',
    turnOnInsidersVersion: 'インサイダー版を使用する',
    turnOffInsidersVersion: 'インサイダー版の使用を停止する',
    supportOnBMC: 'Buy Me a Coffeeでサポートする',
    signOutConfirmation: 'ログアウトしてよろしいですか？',
    settings: 'アカウント設定'
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
    defaultTitle: '無題',
    supportMessage: 'Kakeruが気に入っていただけたら、ぜひサポートをお願いします！'
  },
  flags: {
    title: '試験的な設定',
    hackForSamsungGalaxyNote:
      'Galaxy Note用のハックを有効にする (Sペンを認識するための特殊な処理。ブラウザやOSのバージョンによっては動作しない可能性があります。)',
    disableSmoothingPaths: '線を滑らかにする処理を無効にする',
    disableScaleLimit: '倍率の制限を無効にする'
  },
  welcome: {
    title: 'Kakeruへようこそ!',
    description: 'Kakeruはブラウザで使える手書きのホワイトボードアプリです',
    startUsingNow: '今すぐ使い始める',
    signInWithGoogle: 'Googleアカウントでログインする',
    note1: 'Googleアカウントでログインすると、保存されたデータを他のデバイスでも利用できます。',
    note2:
      'ログインしなくてもデータは保存され、後でGoogleアカウントでログインした際にデータを引き継ぐこともできます。',
    learnMore: '詳しくはこちら'
  },
  signInBanner: {
    text1: '書き込むには、',
    link1: 'ゲストとして始める',
    text2: 'か、',
    link2: 'Googleアカウントでログイン',
    text3: 'してください'
  },
  settings: {
    title: 'アカウント設定',
    defaultAccessibilityLevel: 'デフォルトのアクセス制限',
    defaultAccessibilityLevelDescription: '新しく作成するボードのアクセス制限を指定します',
    public: '誰でも閲覧・書き込み可能',
    protected: '誰でも閲覧でき、自分だけが書き込み可能',
    private: '自分だけが閲覧・書き込み可能',
    apiToken: 'APIトークン',
    yourApiToken: 'あなたのAPIトークン',
    refreshApiToken: 'APIトークンを再設定する',
    refreshingApiToken: 'APIトークンを再設定中...',
    apiTokenIsNotCreated: 'APIトークンはありません',
    createApiToken: 'APIトークンを作成する',
    creatingApiToken: 'APIトークンを作成中...',
    apiDocumentation: 'APIドキュメント',
    backToHome: 'ホームに戻る',
    deleteApiToken: 'APIトークンを削除する'
  },
  shareModal: {
    title: 'シェア / エクスポート',
    format: 'フォーマット',
    linkType: 'リンクタイプ',
    direct: '直接リンク',
    setSize: 'サイズを指定する',
    scale: '拡大率',
    width: '幅',
    height: '高さ',
    linkPreview: 'リンクプレビュー',
    copyLink: 'リンクをコピー',
    download: 'ダウンロード',
    none: 'ページへのリンク',
    png: '画像 (PNG)',
    svg: '画像 (SVG)',
    transparent: '背景を透明にする',
    copied: 'コピーしました！'
  }
}
