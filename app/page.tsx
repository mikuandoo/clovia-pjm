"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProjectStatus = "要件整理" | "生成中" | "確認中" | "納品済";
type AssetStatus = "未着手" | "要件確定" | "生成確認" | "レタッチ中" | "納品OK";
type TabKey = "overview" | "direction" | "review";
type MemberRole = "ディレクター" | "デザイナー（生成）" | "レタッチャー" | "CS担当";
type ProjectFilter = "all" | "active" | "done";
type AppView = "production" | "project" | "members";
type ViewerMode = "internal" | "client";

type RouteState = {
  view: AppView;
  projectId: string;
  assetId: string;
  tab: TabKey;
  filter: ProjectFilter;
  viewer: ViewerMode;
};

type Project = {
  id: string;
  name: string;
  client: string;
  contact: string;
  status: ProjectStatus;
  risk: "低" | "中" | "高";
  priority: "低" | "中" | "高";
  period: string;
  volume: number;
  done: number;
  owner: string;
  designer: string;
  retoucher: string;
  summary: string;
  deliverables: string[];
  materials: string[];
};

type Asset = {
  id: string;
  projectId: string;
  title: string;
  format: string;
  due: string;
  owner: string;
  status: AssetStatus;
  progress: number;
  concept: string;
  must: string[];
  ng: string[];
  references: string[];
  comments: {
    from: string;
    role: string;
    body: string;
    time: string;
  }[];
};

type MemberGroup = {
  role: MemberRole;
  members: string[];
};

type ProjectDraft = {
  name: string;
  client: string;
  risk: "低" | "中" | "高";
  priority: "低" | "中" | "高";
  status: ProjectStatus;
  statusComment: string;
  start: string;
  end: string;
  selectedMembers: string[];
};

const initialProjectDraft: ProjectDraft = {
  name: "",
  client: "",
  risk: "低",
  priority: "中",
  status: "要件整理",
  statusComment: "",
  start: "",
  end: "",
  selectedMembers: []
};

const initialProjects: Project[] = [
  {
    id: "p1",
    name: "2026 Spring ルックブック",
    client: "ACME Apparel",
    contact: "川村 様（MD部）",
    status: "生成中",
    risk: "中",
    priority: "低",
    period: "4/15 - 5/30",
    volume: 10,
    done: 3,
    owner: "前田 涼",
    designer: "佐藤 美咲",
    retoucher: "高木 怜",
    summary:
      "春夏新作のルックブック。ECトップ、特集ページ、SNS広告で横断利用する高単価クリエイティブ制作。",
    deliverables: ["KV縦", "KV横", "全身コーデ", "商品アップ", "SNS正方形", "9:16ストーリー"],
    materials: ["ブランドガイドライン_2026SS.pdf", "商品リスト_春夏.xlsx", "昨季ルックブック参考.pdf"]
  },
  {
    id: "p2",
    name: "母の日キャンペーン",
    client: "Bloom Co.",
    contact: "小林 様",
    status: "確認中",
    risk: "低",
    priority: "中",
    period: "3/20 - 4/25",
    volume: 6,
    done: 5,
    owner: "岡田 久美",
    designer: "山本 葵",
    retoucher: "森 さやか",
    summary: "SNS配信用の母の日キャンペーン。温かみとギフト感を両立した広告ビジュアル。",
    deliverables: ["SNS正方形", "LPヘッダー", "ストーリー広告"],
    materials: ["キャンペーン要項.pdf", "商品画像一式.zip"]
  },
  {
    id: "p3",
    name: "秋冬プレオーダー",
    client: "Bloom Co.",
    contact: "小林 様",
    status: "要件整理",
    risk: "高",
    priority: "高",
    period: "5/10 - 7/05",
    volume: 14,
    done: 2,
    owner: "今井 彩",
    designer: "中村 律",
    retoucher: "高木 怜",
    summary: "秋冬プレオーダー用ビジュアル。素材感、重ね着、予約導線への転用を重視。",
    deliverables: ["先行予約KV", "商品詳細用寄り", "セットアップ訴求", "動画サムネ"],
    materials: ["秋冬商品仮リスト.xlsx", "トーン参考_海外ブランド.pdf"]
  },
  {
    id: "p4",
    name: "定番アイテム 撮り直し",
    client: "ACME Apparel",
    contact: "佐々木 様",
    status: "納品済",
    risk: "低",
    priority: "低",
    period: "2/10 - 3/15",
    volume: 12,
    done: 12,
    owner: "前田 涼",
    designer: "高橋 健",
    retoucher: "森 さやか",
    summary: "定番商品の画像差し替え案件。全カット納品済み、クライアント確認も完了。",
    deliverables: ["商品詳細メイン", "カラバリ一覧", "SNS転用カット"],
    materials: ["定番商品リスト.xlsx", "納品仕様書.pdf"]
  }
];

const initialAssets: Asset[] = [
  ...(
    [
      { title: "メインビジュアル（縦）", due: "4/24", status: "納品OK", progress: 100 },
      { title: "メインビジュアル（横）", due: "4/24", status: "未着手", progress: 0 },
      { title: "コーディネート全身", due: "4/26", status: "未着手", progress: 0 },
      { title: "商品アップ（トップス）", due: "4/26", status: "未着手", progress: 0 },
      { title: "商品アップ（ボトムス）", due: "4/28", status: "未着手", progress: 0 },
      { title: "着用シーン（屋外）", due: "4/30", status: "未着手", progress: 0 },
      { title: "着用シーン（室内）", due: "4/30", status: "未着手", progress: 0 },
      { title: "バナー（正方形）", due: "5/02", status: "未着手", progress: 0 },
      { title: "ストーリー（縦）", due: "5/05", status: "未着手", progress: 0 },
      { title: "ディテール（小物）", due: "5/08", status: "未着手", progress: 0 }
    ] as { title: string; due: string; status: AssetStatus; progress: number }[]
  ).map((item, index) => ({
    id: `a${index + 1}`,
    projectId: "p1",
    title: item.title,
    format: "2000×2500 / JPG / 350dpi",
    due: item.due,
    owner: "佐藤 美咲",
    status: item.status,
    progress: item.progress,
    concept: "2026春夏ルックブック用カット。ブランドトーンに沿って自然光で撮影する。",
    must: ["ブランドトーンに合わせる", "商品の素材感が分かる", "用途に合わせた余白を確保"],
    ng: ["過度な加工", "商品色の変化", "情報過多な背景"],
    references: [],
    comments: []
  })),
  {
    id: "b1",
    projectId: "p2",
    title: "SNS広告 正方形",
    format: "1080×1080 / JPG / 72dpi",
    due: "4/05",
    owner: "山本 葵",
    status: "納品OK",
    progress: 100,
    concept: "母の日ギフト訴求。温かみのある光、親子感、商品が自然に目に入る構図。",
    must: ["ギフト感", "商品視認性", "SNSで止まる明るさ"],
    ng: ["過度なピンク", "文字が読みにくい背景"],
    references: ["母の日過去実績.pdf"],
    comments: [
      {
        from: "小林 様",
        role: "クライアント",
        body: "この方向でOKです。納品データをお願いします。",
        time: "4/08 11:40"
      }
    ]
  },
  {
    id: "c1",
    projectId: "p3",
    title: "先行予約KV",
    format: "2000×2500 / JPG / 350dpi",
    due: "5/20",
    owner: "中村 律",
    status: "未着手",
    progress: 12,
    concept: "秋冬の素材感と重ね着を主役にした先行予約KV。高単価感を損なわない静かなトーン。",
    must: ["素材の重厚感", "予約販売らしい期待感", "ブランドらしい余白"],
    ng: ["量販感", "過度な彩度", "商品が暗く沈む"],
    references: ["海外ブランドAW参考.pdf"],
    comments: [
      {
        from: "岡田 久美",
        role: "ディレクター",
        body: "初回オリエン後に詳細要件を確定します。",
        time: "5/10 13:00"
      }
    ]
  },
  {
    id: "d1",
    projectId: "p4",
    title: "商品詳細メイン",
    format: "1500×1500 / PNG / 300dpi",
    due: "3/10",
    owner: "高橋 健",
    status: "納品OK",
    progress: 100,
    concept: "定番商品の差し替え用メイン画像。既存ECトーンと統一し、商品色を正確に再現する。",
    must: ["商品色の正確性", "既存ECとの統一感", "余白ルール準拠"],
    ng: ["影の出し過ぎ", "彩度の過補正"],
    references: ["既存EC画像.zip", "納品仕様書.pdf"],
    comments: [
      {
        from: "佐々木 様",
        role: "クライアント",
        body: "全カット確認しました。納品版で問題ありません。",
        time: "3/15 14:20"
      }
    ]
  },
  {
    id: "d2",
    projectId: "p4",
    title: "SNS転用カット",
    format: "1080×1080 / JPG / 72dpi",
    due: "3/12",
    owner: "高橋 健",
    status: "納品OK",
    progress: 100,
    concept: "定番商品のSNS再掲用カット。視認性を優先し、背景はミニマルにする。",
    must: ["SNS視認性", "商品中心", "ブランドトーン維持"],
    ng: ["過度な装飾", "コピー領域の不足"],
    references: ["SNS過去投稿.pdf"],
    comments: [
      {
        from: "森 さやか",
        role: "レタッチ",
        body: "納品ファイル一式を整理済みです。",
        time: "3/15 16:00"
      }
    ]
  }
];

const initialMemberGroups: MemberGroup[] = [
  {
    role: "ディレクター",
    members: ["前田 涼", "岡田 久美"]
  },
  {
    role: "デザイナー（生成）",
    members: ["佐藤 美咲", "高橋 健", "山本 葵", "中村 律"]
  },
  {
    role: "レタッチャー",
    members: ["高木 怜", "森 さやか"]
  },
  {
    role: "CS担当",
    members: ["今井 彩", "林 大輔"]
  }
];

const workflow = [
  { label: "要件整理", text: "ブランド要件、用途、素材、NGを一箇所に集約" },
  { label: "ディレクション", text: "画像単位でデザイナー向け指示を確定" },
  { label: "生成・選定", text: "候補を比較し、社内確認からクライアント確認へ" },
  { label: "レタッチ", text: "修正指示と差分確認をコメントに集約" },
  { label: "納品", text: "最終OK、形式、ダウンロード状態を管理" }
];

const statusTone: Record<ProjectStatus | AssetStatus, string> = {
  要件整理: "tone-blue",
  生成中: "tone-purple",
  確認中: "tone-amber",
  納品済: "tone-green",
  未着手: "tone-muted",
  要件確定: "tone-blue",
  生成確認: "tone-purple",
  レタッチ中: "tone-amber",
  納品OK: "tone-green"
};

const levelTone: Record<"低" | "中" | "高", string> = {
  低: "tone-green",
  中: "tone-amber",
  高: "tone-red"
};

// チェックモーダルのフェーズ表現に合わせた作業状況ラベル（作業状況から自動連携）
const CHECK_STATUS_LABEL: Record<AssetStatus, { label: string; tone: string }> = {
  未着手: { label: "未着手", tone: "tone-muted" },
  要件確定: { label: "社内 / 生成", tone: "tone-blue" },
  生成確認: { label: "クライアント / 生成", tone: "tone-purple" },
  レタッチ中: { label: "社内 / レタッチ後", tone: "tone-amber" },
  納品OK: { label: "納品完了", tone: "tone-green" }
};

const SPEC_SIZES = ["2000×2500", "2400×1350", "1500×1875", "1500×1500", "1080×1080"];
const SPEC_FORMATS = ["JPG", "PNG"];
const SPEC_DPIS = ["350", "300", "72"];
const ASSIGNEE_OPTIONS = ["未割当", ...initialMemberGroups.flatMap((group) => group.members)];

type ReqTabType = "overall" | "coordinate" | "model" | "single";

type ReqTab = {
  id: string;
  label: string;
  type: ReqTabType;
  removable?: boolean;
};

const BASE_REQ_TABS: ReqTab[] = [
  { id: "overall", label: "全体イメージ", type: "overall" },
  { id: "coordinate", label: "コーディネート", type: "coordinate" },
  { id: "model", label: "モデル", type: "model" },
  { id: "styling", label: "スタイリング", type: "single" },
  { id: "hairmake", label: "ヘアメイク", type: "single" }
];

const CHECK_PHASES = [
  {
    group: "生成フェーズ",
    step: "社内確認",
    title: "社内（ディレクター） / 生成",
    flow: "アップロード → レビュー（OK/要修正）",
    targetLabel: "確認対象（生成画像）",
    uploadCta: "生成画像をアップロード（複数可）",
    points: [] as string[],
    memoLabel: "ディレクターへの伝達事項（デザイナー記入）",
    memoPlaceholder: "例）この方向で進めます。ご確認ください",
    judgeLabel: "ディレクター判定",
    notify: "ディレクターに通知",
    cta: "クライアント確認へ →",
    ctaNote: "",
    deliver: false
  },
  {
    group: "生成フェーズ",
    step: "クライアント確認",
    title: "クライアント / 生成",
    flow: "アップロード → レビュー（OK/要修正）",
    targetLabel: "確認対象（生成画像）",
    uploadCta: "生成画像をアップロード（複数可）",
    points: [
      "構図・トリミングの大枠",
      "モデル・ポージングの方向性",
      "シーン／トーンの雰囲気",
      "スタイリングの見え方"
    ] as string[],
    memoLabel: "クライアントへの伝達事項（デザイナー記入）",
    memoPlaceholder: "例）この方向で進めます。ご確認ください",
    judgeLabel: "クライアント判定",
    notify: "クライアントに通知",
    cta: "社内/レタッチ後へ →",
    ctaNote: "",
    deliver: false
  },
  {
    group: "レタッチフェーズ",
    step: "社内確認",
    title: "社内（ディレクター） / レタッチ後",
    flow: "納品に向けた確認",
    targetLabel: "レタッチ後画像（未反映）",
    uploadCta: "レタッチ画像をアップロード（複数可）",
    points: [] as string[],
    memoLabel: "ディレクターへの伝達事項（デザイナー記入）",
    memoPlaceholder: "例）ご確認ください。修正点あればお知らせください",
    judgeLabel: "ディレクター判定",
    notify: "ディレクターに通知",
    cta: "クライアント確認へ →",
    ctaNote: "クライアントOKで納品できます",
    deliver: false
  },
  {
    group: "レタッチフェーズ",
    step: "クライアント確認（納品）",
    title: "クライアント / レタッチ後（納品）",
    flow: "納品に向けた確認",
    targetLabel: "レタッチ後画像（未反映）",
    uploadCta: "レタッチ画像をアップロード（複数可）",
    points: [] as string[],
    memoLabel: "クライアントへの伝達事項（デザイナー記入）",
    memoPlaceholder: "例）ご確認ください。修正点あればお知らせください",
    judgeLabel: "クライアント判定",
    notify: "クライアントに通知",
    cta: "納品完了",
    ctaNote: "クライアントOKで納品できます",
    deliver: true
  }
];

function toDateValue(due: string) {
  const [month, day] = due.split("/");
  if (!month || !day) return "";
  return `2026-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function matchProjectFilter(project: Project, filter: ProjectFilter) {
  if (filter === "all") return true;
  if (filter === "done") return project.status === "納品済";
  return project.status !== "納品済";
}

function isTabKey(value: string | null): value is TabKey {
  return value === "overview" || value === "direction" || value === "review";
}

function isProjectFilter(value: string | null): value is ProjectFilter {
  return value === "all" || value === "active" || value === "done";
}

function isViewerMode(value: string | null): value is ViewerMode {
  return value === "internal" || value === "client";
}

function normalizeRoute(
  route: Partial<RouteState>,
  projects: Project[],
  assets: Asset[],
  fallback?: RouteState
): RouteState {
  const fallbackProjectId = fallback?.projectId ?? projects[0]?.id ?? initialProjects[0].id;
  const projectId = projects.some((project) => project.id === route.projectId)
    ? route.projectId!
    : fallbackProjectId;
  const projectAssets = assets.filter((asset) => asset.projectId === projectId);
  const fallbackAssetId = fallback?.assetId ?? projectAssets[0]?.id ?? assets[0]?.id ?? initialAssets[0].id;
  const assetId = projectAssets.some((asset) => asset.id === route.assetId) ? route.assetId! : fallbackAssetId;

  return {
    view: route.view === "project" ? "project" : route.view === "members" ? "members" : "production",
    projectId,
    assetId,
    tab: route.tab ?? fallback?.tab ?? "overview",
    filter: route.filter ?? fallback?.filter ?? "all",
    viewer: route.viewer ?? fallback?.viewer ?? "internal"
  };
}

function routeFromSearch(search: string, projects: Project[], assets: Asset[], fallback?: RouteState) {
  const params = new URLSearchParams(search);
  const viewParam = params.get("view");
  const view = viewParam === "project" ? "project" : viewParam === "members" ? "members" : "production";
  const tabParam = params.get("tab");
  const filterParam = params.get("filter");
  const viewerParam = params.get("viewer");

  return normalizeRoute(
    {
      view,
      projectId: params.get("project") ?? undefined,
      assetId: params.get("asset") ?? undefined,
      tab: isTabKey(tabParam) ? tabParam : undefined,
      filter: isProjectFilter(filterParam) ? filterParam : undefined,
      viewer: isViewerMode(viewerParam) ? viewerParam : undefined
    },
    projects,
    assets,
    fallback
  );
}

function routeToUrl(route: RouteState) {
  const params = new URLSearchParams();

  if (route.view === "project") {
    params.set("view", "project");
    params.set("project", route.projectId);
    params.set("tab", route.tab);
    params.set("asset", route.assetId);
    if (route.viewer === "client") params.set("viewer", "client");
  } else if (route.view === "members") {
    params.set("view", "members");
  } else if (route.filter !== "all") {
    params.set("filter", route.filter);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default function Home() {
  const [projectList, setProjectList] = useState<Project[]>(initialProjects);
  const [assetList, setAssetList] = useState<Asset[]>(initialAssets);
  const [appView, setAppView] = useState<AppView>("production");
  const [viewerMode, setViewerMode] = useState<ViewerMode>("internal");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0].id);
  const [selectedAssetId, setSelectedAssetId] = useState(initialAssets[0].id);
  const [tab, setTab] = useState<TabKey>("overview");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [openSheet, setOpenSheet] = useState<"info" | "models" | null>(null);
  const [assetModal, setAssetModal] = useState<{ assetId: string; tab: "req" | "gen" | "check" } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<string | null>(null);
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>(initialMemberGroups);
  const [memberDrafts, setMemberDrafts] = useState<Record<MemberRole, string>>({
    ディレクター: "",
    "デザイナー（生成）": "",
    レタッチャー: "",
    CS担当: ""
  });
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(initialProjectDraft);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const projectListRef = useRef(projectList);
  const assetListRef = useRef(assetList);
  const routeRef = useRef<RouteState>({
    view: appView,
    projectId: selectedProjectId,
    assetId: selectedAssetId,
    tab,
    filter: projectFilter,
    viewer: viewerMode
  });

  useEffect(() => {
    projectListRef.current = projectList;
  }, [projectList]);

  useEffect(() => {
    assetListRef.current = assetList;
  }, [assetList]);

  function applyRoute(route: RouteState) {
    routeRef.current = route;
    setAppView(route.view);
    setSelectedProjectId(route.projectId);
    setSelectedAssetId(route.assetId);
    setTab(route.tab);
    setProjectFilter(route.filter);
    setViewerMode(route.viewer);
    setIsProjectModalOpen(false);
    setOpenSheet(null);
    setAssetModal(null);
    setPreviewAsset(null);
  }

  function writeRoute(routePatch: Partial<RouteState>, mode: "push" | "replace" = "push") {
    const route = normalizeRoute(
      { ...routeRef.current, ...routePatch },
      projectListRef.current,
      assetListRef.current,
      routeRef.current
    );
    applyRoute(route);

    const nextUrl = routeToUrl(route);
    if (window.location.pathname + window.location.search === nextUrl) return;
    if (mode === "replace") {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }
  }

  useEffect(() => {
    const syncFromUrl = () => {
      const route = routeFromSearch(
        window.location.search,
        projectListRef.current,
        assetListRef.current,
        routeRef.current
      );
      applyRoute(route);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const selectedProject = useMemo(
    () => projectList.find((project) => project.id === selectedProjectId) ?? projectList[0],
    [projectList, selectedProjectId]
  );

  const projectAssets = useMemo(
    () => assetList.filter((asset) => asset.projectId === selectedProject.id),
    [assetList, selectedProject.id]
  );

  const selectedAsset = useMemo(() => {
    const inProject = projectAssets.find((asset) => asset.id === selectedAssetId);
    return inProject ?? projectAssets[0] ?? assetList[0];
  }, [assetList, projectAssets, selectedAssetId]);

  const filteredProjectList = useMemo(
    () => projectList.filter((project) => matchProjectFilter(project, projectFilter)),
    [projectFilter, projectList]
  );

  function openProject(projectId: string, nextTab: TabKey = "overview", assetId?: string) {
    const nextAssets = assetList.filter((asset) => asset.projectId === projectId);
    writeRoute({
      view: "project",
      projectId,
      assetId: assetId ?? nextAssets[0]?.id ?? assetList[0].id,
      tab: nextTab
    });
  }

  function issueProjectLink(projectId: string) {
    const nextAssets = assetList.filter((asset) => asset.projectId === projectId);
    const route: RouteState = {
      view: "project",
      projectId,
      assetId: nextAssets[0]?.id ?? assetList[0].id,
      tab: "overview",
      filter: "all",
      viewer: "client"
    };
    const url = window.location.origin + routeToUrl(route);

    const markCopied = () => {
      setCopiedLinkId(projectId);
      window.setTimeout(() => {
        setCopiedLinkId((current) => (current === projectId ? null : current));
      }, 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(markCopied).catch(() => window.prompt("リンクをコピーしてください", url));
    } else {
      window.prompt("リンクをコピーしてください", url);
    }
  }

  function applyProjectFilter(filter: ProjectFilter) {
    const nextProject = projectList.find((project) => matchProjectFilter(project, filter));
    if (!nextProject) {
      writeRoute({ view: "production", filter });
      return;
    }
    const nextAssets = assetList.filter((asset) => asset.projectId === nextProject.id);
    writeRoute({
      view: "production",
      filter,
      projectId: nextProject.id,
      assetId: nextAssets[0]?.id ?? assetList[0].id,
      tab: "overview"
    });
  }

  function addMember(role: MemberRole) {
    const name = memberDrafts[role].trim();
    if (!name) return;

    setMemberGroups((groups) =>
      groups.map((group) => {
        if (group.role !== role || group.members.includes(name)) return group;
        return { ...group, members: [...group.members, name] };
      })
    );
    setMemberDrafts((drafts) => ({ ...drafts, [role]: "" }));
  }

  function removeMember(role: MemberRole, name: string) {
    setMemberGroups((groups) =>
      groups.map((group) =>
        group.role === role ? { ...group, members: group.members.filter((member) => member !== name) } : group
      )
    );
  }

  function toggleProjectMember(name: string) {
    setProjectDraft((draft) => {
      const selectedMembers = draft.selectedMembers.includes(name)
        ? draft.selectedMembers.filter((member) => member !== name)
        : [...draft.selectedMembers, name];
      return { ...draft, selectedMembers };
    });
  }

  function createProject() {
    const projectName = projectDraft.name.trim();
    const clientName = projectDraft.client.trim();
    if (!projectName || !clientName) return;

    const id = `p${Date.now()}`;
    const selectedMembers = projectDraft.selectedMembers.length
      ? projectDraft.selectedMembers
      : memberGroups.flatMap((group) => group.members).slice(0, 5);
    const owner = selectedMembers.find((member) => memberRole(memberGroups, member) === "ディレクター") ?? selectedMembers[0] ?? "未割当";
    const designer =
      selectedMembers.find((member) => memberRole(memberGroups, member) === "デザイナー（生成）") ??
      selectedMembers[0] ??
      "未割当";
    const retoucher =
      selectedMembers.find((member) => memberRole(memberGroups, member) === "レタッチャー") ??
      selectedMembers[0] ??
      "未割当";
    const volume = 3;
    const done = projectDraft.status === "納品済" ? volume : 0;
    const period = `${projectDraft.start.trim() || "未設定"} - ${projectDraft.end.trim() || "未設定"}`;
    const summary =
      projectDraft.statusComment.trim() ||
      `${projectDraft.status}。${clientName}向けのハイクリエイティブ制作プロジェクト。`;

    const nextProject: Project = {
      id,
      name: projectName,
      client: clientName,
      contact: "未設定",
      status: projectDraft.status,
      risk: projectDraft.risk,
      priority: projectDraft.priority,
      period,
      volume,
      done,
      owner,
      designer,
      retoucher,
      summary,
      deliverables: ["メインビジュアル", "横長バナー", "SNS正方形"],
      materials: []
    };

    const nextAssets = makeInitialAssets(id, designer, projectDraft.end.trim() || "未設定");
    const nextProjectList = [nextProject, ...projectList];
    const nextAssetList = [...nextAssets, ...assetList];
    const nextRoute: RouteState = {
      view: "project",
      projectId: id,
      assetId: nextAssets[0].id,
      tab: "overview",
      filter: "all",
      viewer: viewerMode
    };

    projectListRef.current = nextProjectList;
    assetListRef.current = nextAssetList;
    setProjectList(nextProjectList);
    setAssetList(nextAssetList);
    applyRoute(nextRoute);
    window.history.pushState(null, "", routeToUrl(nextRoute));
    setProjectDraft(initialProjectDraft);
  }

  return (
    <main className="shell">
      <section className="app">
        <header className="topbar">
          <div className="brand">Clovia</div>
          <nav className="main-nav">
            <button
              className={appView === "production" ? "on" : ""}
              onClick={() => writeRoute({ view: "production" })}
            >
              制作管理
            </button>
            <button
              className={appView === "members" ? "on" : ""}
              onClick={() => writeRoute({ view: "members" })}
            >
              メンバー管理
            </button>
          </nav>
        </header>

        {appView === "production" ? (
          <>
            <section className="panel">
              <div className="panel-head">
                <div className="seg compact">
                  <button className={projectFilter === "all" ? "on" : ""} onClick={() => applyProjectFilter("all")}>
                    すべて
                  </button>
                  <button className={projectFilter === "active" ? "on" : ""} onClick={() => applyProjectFilter("active")}>
                    進行中
                  </button>
                  <button className={projectFilter === "done" ? "on" : ""} onClick={() => applyProjectFilter("done")}>
                    完了
                  </button>
                </div>
                <button className="button primary sm" onClick={() => setIsProjectModalOpen(true)}>
                  プロジェクト追加
                </button>
              </div>

              {filteredProjectList.length ? (
                <div className="asset-table-wrap">
                  <table className="asset-table">
                    <thead>
                      <tr>
                        <th>案件名</th>
                        <th>ステータス</th>
                        <th>ブランド</th>
                        <th>進行リスク</th>
                        <th>優先度</th>
                        <th>期間</th>
                        <th>制作ボリューム</th>
                        <th>メンバー</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjectList.map((project) => {
                        const percent = Math.round((project.done / project.volume) * 100);
                        return (
                          <tr
                            key={project.id}
                            className="clickable-row"
                            onClick={() => openProject(project.id)}
                          >
                            <td className="row-title">{project.name}</td>
                            <td>
                              <Badge tone={statusTone[project.status]}>{project.status}</Badge>
                            </td>
                            <td>{project.client}</td>
                            <td>
                              <Badge tone={levelTone[project.risk]}>{project.risk}</Badge>
                            </td>
                            <td>
                              <Badge tone={levelTone[project.priority]}>{project.priority}</Badge>
                            </td>
                            <td>{project.period}</td>
                            <td>
                              <div className="table-progress">
                                <div className="progress">
                                  <span style={{ width: `${percent}%` }} />
                                </div>
                                <small>
                                  {project.done}/{project.volume}枚（{percent}%）
                                </small>
                              </div>
                            </td>
                            <td>{projectMembers(project).join("、")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>該当する案件がありません</strong>
                  <p>別のステータスを選択してください。</p>
                </div>
              )}
            </section>
          </>
        ) : appView === "members" ? (
          <MembersView
            groups={memberGroups}
            drafts={memberDrafts}
            onDraftChange={(role, value) => setMemberDrafts((drafts) => ({ ...drafts, [role]: value }))}
            onAdd={addMember}
            onRemove={removeMember}
          />
        ) : (
          <>
            <section className="head project-head">
              <div>
                <button className="button ghost sm back-button" onClick={() => writeRoute({ view: "production" })}>
                  ← 戻る
                </button>
                <div className="project-head-title">
                  <div>
                    <h1 className="project-title">{selectedProject.name}</h1>
                    <p>{selectedProject.client} ／ {selectedProject.period}</p>
                  </div>
                  <div className="project-head-actions">
                    <button className="button ghost sm" onClick={() => setOpenSheet("info")}>
                      プロジェクト概要
                    </button>
                    <button className="button ghost sm" onClick={() => setOpenSheet("models")}>
                      モデル登録
                    </button>
                    <button
                      className="button primary sm"
                      onClick={() => issueProjectLink(selectedProject.id)}
                    >
                      {copiedLinkId === selectedProject.id ? "✓ コピーしました" : "🔗 リンクを発行"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="detail">
              <Overview
                assets={projectAssets}
                onOpenAsset={(assetId, tab) => setAssetModal({ assetId, tab })}
                onPreview={(assetId) => setPreviewAsset(assetId)}
              />
            </section>
          </>
        )}

        {isProjectModalOpen && (
          <ProjectModal
            draft={projectDraft}
            memberGroups={memberGroups}
            onDraftChange={(patch) => setProjectDraft((draft) => ({ ...draft, ...patch }))}
            onToggleMember={toggleProjectMember}
            onCreate={createProject}
            onClose={() => setIsProjectModalOpen(false)}
          />
        )}

        {openSheet && appView === "project" && (
          <InfoSheet mode={openSheet} project={selectedProject} onClose={() => setOpenSheet(null)} />
        )}

        {assetModal &&
          appView === "project" &&
          (() => {
            const asset = assetList.find((item) => item.id === assetModal.assetId);
            if (!asset) return null;
            const number = projectAssets.findIndex((item) => item.id === asset.id) + 1;
            if (assetModal.tab === "gen") {
              return <GenerateModal asset={asset} onClose={() => setAssetModal(null)} />;
            }
            return (
              <AssetModal
                asset={asset}
                number={number}
                initialTab={assetModal.tab}
                onClose={() => setAssetModal(null)}
              />
            );
          })()}

        {previewAsset &&
          appView === "project" &&
          (() => {
            const asset = assetList.find((item) => item.id === previewAsset);
            if (!asset) return null;
            return <ImageLightbox asset={asset} onClose={() => setPreviewAsset(null)} />;
          })()}
      </section>
    </main>
  );
}

function memberRole(groups: MemberGroup[], name: string) {
  return groups.find((group) => group.members.includes(name))?.role;
}

function projectMembers(project: Project) {
  return Array.from(new Set([project.owner, project.designer, project.retoucher])).filter(
    (name) => name && name !== "未割当"
  );
}

function makeInitialAssets(projectId: string, owner: string, due: string): Asset[] {
  const baseAssets = [
    {
      title: "メインビジュアル",
      format: "2000×2500 / JPG / 350dpi",
      concept: "ブランドの世界観を伝える主役ビジュアル。用途に合わせて余白を確保し、広告転用しやすい構図にする。"
    },
    {
      title: "横長バナー",
      format: "2400×1350 / JPG / 300dpi",
      concept: "掲載ページ・広告配信用の横長バナー。被写体とコピー領域のバランスを優先する。"
    },
    {
      title: "SNS正方形",
      format: "1080×1080 / JPG / 72dpi",
      concept: "SNSフィードで視認性を確保する正方形クリエイティブ。商品とトーンが即時に伝わる構成にする。"
    }
  ];

  return baseAssets.map((asset, index) => ({
    id: `${projectId}-a${index + 1}`,
    projectId,
    title: asset.title,
    format: asset.format,
    due,
    owner,
    status: "未着手",
    progress: 0,
    concept: asset.concept,
    must: ["ブランドトーンに合わせる", "用途に合わせた余白を確保", "商品・モデルの見え方を優先"],
    ng: ["過度な加工", "商品色の変化", "情報過多な背景"],
    references: [],
    comments: [
      {
        from: "システム",
        role: "下書き",
        body: "プロジェクト作成時に自動生成された初期画像です。要件を具体化してください。",
        time: "作成直後"
      }
    ]
  }));
}

function ProjectModal({
  draft,
  memberGroups,
  onDraftChange,
  onToggleMember,
  onCreate,
  onClose
}: {
  draft: ProjectDraft;
  memberGroups: MemberGroup[];
  onDraftChange: (patch: Partial<ProjectDraft>) => void;
  onToggleMember: (name: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  const allMembers = memberGroups.flatMap((group) =>
    group.members.map((name) => ({
      name,
      role: group.role
    }))
  );
  const canCreate = draft.name.trim().length > 0 && draft.client.trim().length > 0;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="member-modal project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h2 id="project-modal-title">プロジェクトを追加</h2>
            <p>β版では入力内容をフロント状態に保存し、初期画像3件を自動作成します。</p>
          </div>
          <button className="button ghost modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <form
          className="project-form"
          onSubmit={(event) => {
            event.preventDefault();
            onCreate();
          }}
        >
          <FormField label="プロジェクト名" required>
            <input
              value={draft.name}
              onChange={(event) => onDraftChange({ name: event.target.value })}
              placeholder="例）2026 Autumn ルックブック"
              autoFocus
            />
          </FormField>

          <FormField label="ブランド名" required>
            <input
              value={draft.client}
              onChange={(event) => onDraftChange({ client: event.target.value })}
              placeholder="例）ACME Apparel"
            />
          </FormField>

          <div className="project-form-grid">
            <FormField label="進行リスク">
              <SegmentedChoice
                value={draft.risk}
                options={["低", "中", "高"]}
                onChange={(risk) => onDraftChange({ risk })}
              />
            </FormField>
            <FormField label="優先度">
              <SegmentedChoice
                value={draft.priority}
                options={["低", "中", "高"]}
                onChange={(priority) => onDraftChange({ priority })}
              />
            </FormField>
          </div>

          <FormField label="進行ステータス">
            <SegmentedChoice
              value={draft.status}
              options={["要件整理", "生成中", "納品済"]}
              labels={["開始予定", "進行中", "完了"]}
              onChange={(status) => onDraftChange({ status })}
            />
          </FormField>

          <FormField label="ステータス詳細">
            <input
              value={draft.statusComment}
              onChange={(event) => onDraftChange({ statusComment: event.target.value })}
              placeholder="例）オリエン待ち"
            />
          </FormField>

          <div className="project-form-grid">
            <FormField label="開始日">
              <input
                value={draft.start}
                onChange={(event) => onDraftChange({ start: event.target.value })}
                placeholder="例）6/01"
              />
            </FormField>
            <FormField label="終了日">
              <input
                value={draft.end}
                onChange={(event) => onDraftChange({ end: event.target.value })}
                placeholder="例）7/15"
              />
            </FormField>
          </div>

          <FormField label="PJメンバー（全社メンバーから割り当て）">
            <div className="project-member-picker">
              {allMembers.map((member) => (
                <button
                  className={`project-member-chip ${
                    draft.selectedMembers.includes(member.name) ? "selected" : ""
                  }`}
                  key={`${member.role}-${member.name}`}
                  type="button"
                  onClick={() => onToggleMember(member.name)}
                >
                  <span>{roleLabel(member.role)}</span>
                  <b>{member.name}</b>
                  <small>{member.role}</small>
                </button>
              ))}
            </div>
          </FormField>

          <div className="project-modal-foot">
            <button className="button primary create-button" type="submit" disabled={!canCreate}>
              作成
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormField({
  label,
  required,
  children
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? <b> 必須</b> : null}
      </span>
      {children}
    </label>
  );
}

function SegmentedChoice<T extends string>({
  value,
  options,
  labels,
  onChange
}: {
  value: T;
  options: T[];
  labels?: string[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="form-segment">
      {options.map((option, index) => (
        <button
          className={option === value ? "selected" : ""}
          key={option}
          type="button"
          onClick={() => onChange(option)}
        >
          {labels?.[index] ?? option}
        </button>
      ))}
    </div>
  );
}

function MembersView({
  groups,
  drafts,
  onDraftChange,
  onAdd,
  onRemove
}: {
  groups: MemberGroup[];
  drafts: Record<MemberRole, string>;
  onDraftChange: (role: MemberRole, value: string) => void;
  onAdd: (role: MemberRole) => void;
  onRemove: (role: MemberRole, name: string) => void;
}) {
  const [role, setRole] = useState<MemberRole>(groups[0]?.role ?? "ディレクター");
  const rows = groups.flatMap((group) => group.members.map((name) => ({ name, role: group.role })));

  return (
    <section className="panel">
      <div className="panel-head">
        <form
          className="member-add-row"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd(role);
          }}
        >
          <select value={role} onChange={(event) => setRole(event.target.value as MemberRole)}>
            {groups.map((group) => (
              <option key={group.role} value={group.role}>
                {group.role}
              </option>
            ))}
          </select>
          <input
            value={drafts[role]}
            onChange={(event) => onDraftChange(role, event.target.value)}
            placeholder="名前を追加"
          />
          <button className="button primary sm" type="submit">
            追加
          </button>
        </form>
      </div>

      {rows.length ? (
        <div className="asset-table-wrap">
          <table className="asset-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>役割</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.role}-${row.name}`}>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>
                    <button onClick={() => onRemove(row.role, row.name)}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <strong>メンバーが登録されていません</strong>
          <p>上の入力欄からメンバーを追加してください。</p>
        </div>
      )}
    </section>
  );
}

function roleLabel(role: MemberRole) {
  const labels: Record<MemberRole, string> = {
    ディレクター: "Dir",
    "デザイナー（生成）": "Gen",
    レタッチャー: "Ret",
    CS担当: "CS"
  };

  return labels[role];
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function InfoSheet({
  mode,
  project,
  onClose
}: {
  mode: "info" | "models";
  project: Project;
  onClose: () => void;
}) {
  const modelSummary = getModelSummary(project.id);
  const scheduleText = getProjectSchedule(project);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="side-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-sheet-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sheet-head">
          <h2 id="info-sheet-title">{mode === "models" ? "モデル登録" : "プロジェクト概要"}</h2>
          <button className="button ghost modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="sheet-body">
          {mode === "info" ? (
            <section className="sheet-section">
            <div className="overview-form">
              <FormField label="プロジェクト名">
                <input key={`${project.id}-name`} defaultValue={project.name} />
              </FormField>
              <FormField label="ブランド名">
                <input key={`${project.id}-client`} defaultValue={project.client} />
              </FormField>
              <FormField label="PJ背景／クリエイティブ用途">
                <textarea key={`${project.id}-summary`} defaultValue={project.summary} rows={3} />
              </FormField>
              <FormField label="スケジュール（テキスト）">
                <textarea key={`${project.id}-schedule`} defaultValue={scheduleText} rows={2} />
              </FormField>
              <FormField label="その他コメント">
                <textarea key={`${project.id}-comment`} placeholder="連絡事項・補足など" rows={2} />
              </FormField>
              <FormField label="関連リンク（HP・SNSなど）">
                <textarea
                  key={`${project.id}-links`}
                  placeholder="HP・SNSのURLを貼り付け（改行区切りでOK）"
                  rows={2}
                />
              </FormField>

              <div className="overview-upload">
                <div className="overview-upload-head">
                  <span>関連資料（アップロード）</span>
                  <button className="button ghost sm" type="button">
                    ＋ アップロード
                  </button>
                </div>
                <div className="overview-file-list">
                  {project.materials.length ? (
                    project.materials.map((file) => (
                      <div className="overview-file" key={file}>
                        <span className="overview-file-name">
                          <span className="overview-file-clip">📎</span>
                          {file}
                        </span>
                        <button type="button" aria-label={`${file}を削除`}>
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="resource-empty">添付資料はありません</p>
                  )}
                </div>
              </div>
            </div>
            </section>
          ) : (
            <section className="sheet-section">
              <div className="model-gender-grid">
                <ModelGenderGroup label="女性モデル" count={modelSummary.women} />
                <ModelGenderGroup label="男性モデル" count={modelSummary.men} />
              </div>
            </section>
          )}
        </div>
        <footer className="sheet-foot">
          <button className="button ghost" type="button" onClick={onClose}>
            キャンセル
          </button>
          <button className="button primary" type="button" onClick={onClose}>
            保存
          </button>
        </footer>
      </aside>
    </div>
  );
}

function ImageZoom({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="image-zoom-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="image-zoom" onMouseDown={(event) => event.stopPropagation()}>
        <button className="button ghost sm image-zoom-close" type="button" onClick={onClose}>
          ✕ 閉じる
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="拡大表示" />
      </div>
    </div>
  );
}

function UploadSlots({ cta }: { cta?: string } = {}) {
  const [images, setImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImages((prev) => [...prev, ...Array.from(files).map((file) => URL.createObjectURL(file))]);
  };
  const remove = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  return (
    <>
    <div className="req-uploads">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
      {images.map((src, index) => (
        <button
          type="button"
          className="upload-slot filled"
          key={src}
          onClick={() => setZoom(src)}
          aria-label={`画像${index + 1}を拡大`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`アップロード画像 ${index + 1}`} />
          <span
            className="slot-x"
            role="button"
            aria-label={`画像${index + 1}を削除`}
            onClick={(event) => {
              event.stopPropagation();
              remove(index);
            }}
          >
            ×
          </span>
          <span className="slot-num">{index + 1}</span>
        </button>
      ))}
      <button className="slot-add" type="button" onClick={() => inputRef.current?.click()}>
        ＋
      </button>
      {zoom && <ImageZoom src={zoom} onClose={() => setZoom(null)} />}
    </div>
    {cta && (
      <button
        type="button"
        className="upload-cta"
        onClick={() => inputRef.current?.click()}
      >
        ＋ {cta}
      </button>
    )}
    </>
  );
}

function ReqModelRows({
  count,
  kind
}: {
  count: number;
  kind: "coordinate" | "model" | "single";
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div className="req-model-row" key={index}>
          <div className="req-model-label">モデル{index + 1}</div>
          <div className="req-model-body">
            {kind === "model" ? (
              <div className="req-uploads">
                <div className="model-pill">♀</div>
                <div className="model-pill">♀</div>
                <div className="model-pill">♂</div>
                <div className="model-pill">♂</div>
                <div className="model-pill">♂</div>
                <button className="slot-add-dashed" type="button">
                  ＋ モデル追加
                </button>
              </div>
            ) : (
              <UploadSlots />
            )}
            <textarea className="req-comment" rows={3} placeholder="この画像へのコメント" />
          </div>
        </div>
      ))}
    </>
  );
}

const GEN_DESTINATIONS = ["社内/生成", "クライアント/生成", "社内/レタッチ後", "クライアント/レタッチ後"];

const FIX_STAGES = [
  { value: "社内 / 生成", reviewer: "社内", comment: "背景はもっとシンプルに" },
  { value: "クライアント / 生成", reviewer: "クライアント", comment: "モデルの表情をやわらかく" },
  { value: "社内 / レタッチ後", reviewer: "社内", comment: "肌のトーンを自然に整える" },
  { value: "クライアント / レタッチ後", reviewer: "クライアント", comment: "全体を少し明るく" }
];

const DIRECTION_SECTIONS: { label: string; images: number; comment: string }[] = [
  {
    label: "概要コメント",
    images: 0,
    comment:
      "ECトップのメインKV。春の新作トップスを主役に、休日の朝の外出シーンを想起させる明るく軽やかなトーンで。"
  },
  {
    label: "全体イメージ",
    images: 1,
    comment: "全身が無理なく収まり、上下に余白を確保（バナー転用前提）。屋外の並木道で自然光を希望。"
  },
  {
    label: "コーディネート",
    images: 2,
    comment: "白系トップス＋ベージュボトムスのナチュラルコーデ。正面／背面の2カット。"
  },
  { label: "モデル", images: 0, comment: "20代後半・ナチュラルメイク・自然な表情。" },
  { label: "スタイリング", images: 0, comment: "抜け感のある軽やかなスタイリング。小物は最小限。" },
  { label: "ヘアメイク", images: 0, comment: "ダウンスタイル／ツヤ感のあるナチュラルメイク。" }
];

function DirectionSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="modal-backdrop direction-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="direction-sheet"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="direction-head">
          <h2>ディレクション（要件）内容</h2>
          <button className="button ghost sm" type="button" onClick={onClose}>
            × 閉じる
          </button>
        </header>
        <div className="direction-body">
          {DIRECTION_SECTIONS.map((section) => (
            <div className="direction-section" key={section.label}>
              <span className="direction-label">{section.label}</span>
              {section.images > 0 && (
                <div className="direction-thumbs">
                  {Array.from({ length: section.images }).map((_, index) => (
                    <div className="direction-thumb" key={index} />
                  ))}
                </div>
              )}
              <p className="direction-text">{section.comment || "—"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function GenerateModal({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const [showDirection, setShowDirection] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [tab, setTab] = useState<"init" | "fix">("init");
  const [outputCount, setOutputCount] = useState(5);
  const [variation, setVariation] = useState<"same" | "minor">("same");
  const [candidates, setCandidates] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [destination, setDestination] = useState(GEN_DESTINATIONS[0]);
  const [prompt, setPrompt] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [fixStage, setFixStage] = useState(FIX_STAGES[0].value);
  const [fixPrompt, setFixPrompt] = useState("");
  const [generatingFixPrompt, setGeneratingFixPrompt] = useState(false);

  const currentFixStage = FIX_STAGES.find((stage) => stage.value === fixStage) ?? FIX_STAGES[0];
  const fixStageTag = currentFixStage.value.replace(/\s/g, "");
  const fixInstructionDefault = [
    "# 元の生成プロンプト",
    prompt.trim() ? prompt.trim() : "（未設定）",
    "",
    `# チェックコメント（${fixStageTag}）`,
    currentFixStage.comment
  ].join("\n");

  const instructionDefault = [
    "# ディレクション内容",
    "",
    `概要:（${asset.concept ? "記載あり" : "記載なし"}）`,
    "全体イメージ:（指定なし）",
    "コーディネート:（指定なし）",
    "モデル:（指定なし）",
    "スタイリング:（指定なし）",
    "ヘアメイク:（指定なし）"
  ].join("\n");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const generate = () => {
    setGeneratingImages(true);
    setCandidates([]);
    setSelected(null);
    window.setTimeout(() => {
      setCandidates(Array.from({ length: outputCount }, (_, index) => index));
      setGeneratingImages(false);
    }, 1400);
  };

  const reflect = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2400);
  };

  const createFixPrompt = () => {
    setGeneratingFixPrompt(true);
    window.setTimeout(() => {
      const base = prompt.trim()
        ? prompt.trim()
        : "A woman in her late 20s wearing a light spring top and beige bottoms, natural makeup, standing on a tree-lined street in soft morning light. Full-body composition with margin at top and bottom for banner use. Bright, airy and gentle tone, photorealistic, high resolution.";
      setFixPrompt(
        `${base}\n\n# 修正指示（${fixStageTag}）\n${currentFixStage.comment}`
      );
      setGeneratingFixPrompt(false);
    }, 1200);
  };

  const createPrompt = () => {
    setGeneratingPrompt(true);
    window.setTimeout(() => {
      setPrompt(
        "A woman in her late 20s wearing a light spring top and beige bottoms, natural makeup, standing on a tree-lined street in soft morning light. Full-body composition with margin at top and bottom for banner use. Bright, airy and gentle tone, photorealistic, high resolution."
      );
      setGeneratingPrompt(false);
    }, 1200);
  };

  return (
    <div className="modal-backdrop asset-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="asset-modal asset-modal--gen"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="asset-modal-head">
          <div className="asset-modal-head-left">
            <span className="asset-modal-kicker">生成</span>
          </div>
        </header>

        <div className="asset-modal-body gen-body">
          <p className="gen-subhead">
            要件をもとにChatGPTへ情報を渡し生成プロンプトを作成 → 画像候補（5〜10枚）を出力。固まれば社内チェックへ反映します。
          </p>

          <div className="gen-tabs">
            <button
              type="button"
              className={`gen-tab ${tab === "init" ? "on" : ""}`}
              onClick={() => setTab("init")}
            >
              初期生成
            </button>
            <button
              type="button"
              className={`gen-tab ${tab === "fix" ? "on" : ""}`}
              onClick={() => setTab("fix")}
            >
              修正生成
            </button>
          </div>

          <div className="gen-cols">
            {tab === "fix" ? (
            <section className="modal-card gen-col">
              <div className="gen-col-head">
                <h3>修正生成</h3>
                <span className="gen-subhead">チェックのコメントを反映</span>
              </div>

              <div>
                <span className="field-label">対象のチェック段階</span>
                <select
                  className="modal-input"
                  value={fixStage}
                  onChange={(event) => setFixStage(event.target.value)}
                >
                  {FIX_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="field-label">この段階のコメント</span>
                <div className="gen-comment-box">
                  {currentFixStage.reviewer} {currentFixStage.comment}
                </div>
              </div>

              <div>
                <div className="gen-field-head">
                  <span className="field-label">CHATGPTへの指示（修正）</span>
                  <button
                    className="button primary sm gen-chatgpt"
                    type="button"
                    onClick={createFixPrompt}
                    disabled={generatingFixPrompt}
                  >
                    {generatingFixPrompt ? (
                      <>
                        <span className="gen-spinner" aria-hidden />
                        生成中…
                      </>
                    ) : (
                      "ChatGPTで修正プロンプトを作成"
                    )}
                  </button>
                </div>
                <textarea
                  className="modal-input gen-textarea"
                  rows={6}
                  key={fixStage}
                  defaultValue={fixInstructionDefault}
                />
              </div>

              <div>
                <span className="field-label">生成に使う参照画像（選択／アップロード）</span>
                <UploadSlots cta="画像をアップロード" />
              </div>

              <div>
                <span className="field-label">修正プロンプト（元の使ったプロンプト＋コメント）</span>
                <textarea
                  className="modal-input gen-textarea"
                  rows={6}
                  placeholder="元プロンプトを表示。「コメントから作成」でコメントを追記"
                  value={fixPrompt}
                  onChange={(event) => setFixPrompt(event.target.value)}
                />
              </div>

              <div className="gen-col-foot">
                <button
                  className="button primary"
                  type="button"
                  onClick={generate}
                  disabled={generatingImages}
                >
                  {generatingImages ? (
                    <>
                      <span className="gen-spinner" aria-hidden />
                      生成中…
                    </>
                  ) : (
                    "この修正で再生成"
                  )}
                </button>
              </div>
            </section>
            ) : (
            <section className="modal-card gen-col">
              <div className="gen-col-head">
                <h3>生成プロンプト作成</h3>
                <button
                  className="button ghost sm"
                  type="button"
                  onClick={() => setShowDirection(true)}
                >
                  📋 ディレクションを確認
                </button>
              </div>

              <span className="field-label">CHATGPTに送る参照画像（選択／アップロード）</span>
              <UploadSlots />

              <div className="gen-field-head">
                <span className="field-label">CHATGPTへの指示（テキスト）</span>
                <button
                  className="button primary sm gen-chatgpt"
                  type="button"
                  onClick={createPrompt}
                  disabled={generatingPrompt}
                >
                  {generatingPrompt ? (
                    <>
                      <span className="gen-spinner" aria-hidden />
                      生成中…
                    </>
                  ) : (
                    "ChatGPTで生成プロンプトを作成"
                  )}
                </button>
              </div>
              <textarea
                className="modal-input gen-textarea"
                rows={8}
                defaultValue={instructionDefault}
              />

              <div className="gen-divider" />

              <span className="field-label">生成プロンプト（この画像で使用／画像生成AIへ）</span>
              <textarea
                className="modal-input gen-textarea"
                rows={8}
                placeholder="「ChatGPTで生成プロンプトを作成」を押すと生成されます"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />

              <span className="field-label">生成に使う参照画像（選択／アップロード）</span>
              <UploadSlots />

              <span className="field-label">候補の作り方</span>
              <div className="gen-variation">
                <button
                  type="button"
                  className={variation === "same" ? "on" : ""}
                  onClick={() => setVariation("same")}
                >
                  同じプロンプトで{outputCount}枚
                </button>
                <button
                  type="button"
                  className={variation === "minor" ? "on" : ""}
                  onClick={() => setVariation("minor")}
                >
                  候補ごとにマイナーチェンジ
                </button>
              </div>

              <div className="gen-col-foot">
                <button
                  className="button primary"
                  type="button"
                  onClick={generate}
                  disabled={generatingImages}
                >
                  {generatingImages ? (
                    <>
                      <span className="gen-spinner" aria-hidden />
                      生成中…
                    </>
                  ) : (
                    "画像を生成"
                  )}
                </button>
              </div>
            </section>
            )}

            <section className="modal-card gen-col">
              <div className="gen-col-head">
                <h3>生成候補</h3>
                <div className="gen-output">
                  出力
                  <select
                    value={outputCount}
                    onChange={(event) => setOutputCount(Number(event.target.value))}
                  >
                    {[5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  枚
                </div>
              </div>

              {generatingImages ? (
                <div className="gen-empty gen-loading">
                  <span className="gen-spinner gen-spinner--dark" aria-hidden />
                  <p>画像を生成しています…</p>
                </div>
              ) : candidates.length === 0 ? (
                <div className="gen-empty">
                  <strong>未生成</strong>
                  <p>まだ生成されていません。プロンプトを入力して「画像を生成」を押してください。</p>
                  <p className="muted-inline">
                    クリックで採用画像を選択。候補が微妙ならプロンプトを直して再度「生成」できます。
                  </p>
                </div>
              ) : (
                <div className="gen-candidates">
                  {candidates.map((candidate) => (
                    <button
                      type="button"
                      key={candidate}
                      className={`gen-candidate ${selected === candidate ? "on" : ""}`}
                      onClick={() => setSelected(candidate)}
                    >
                      <span className="gen-candidate-num">候補 {candidate + 1}</span>
                      {selected === candidate && <span className="gen-candidate-badge">採用</span>}
                    </button>
                  ))}
                </div>
              )}

              <div className="gen-col-foot gen-reflect">
                <label className="gen-dest">
                  反映先
                  <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                    {GEN_DESTINATIONS.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button primary"
                  type="button"
                  disabled={candidates.length === 0}
                  onClick={reflect}
                >
                  反映
                </button>
              </div>
            </section>
          </div>
        </div>

        <footer className="asset-modal-foot">
          <button className="button ghost" type="button" onClick={onClose}>
            閉じる
          </button>
        </footer>

        {showDirection && <DirectionSheet onClose={() => setShowDirection(false)} />}
        {showToast && (
          <div className="gen-toast" role="status" aria-live="polite">
            ✓ 反映しました
          </div>
        )}
      </section>
    </div>
  );
}

function AssetModal({
  asset,
  number,
  initialTab,
  onClose
}: {
  asset: Asset;
  number: number;
  initialTab: "req" | "check";
  onClose: () => void;
}) {
  const [modelCount, setModelCount] = useState(1);
  const [checkStep, setCheckStep] = useState(0);
  const [judge, setJudge] = useState<"要修正" | "OK" | null>(null);
  const [fixComment, setFixComment] = useState("");
  const [fixComments, setFixComments] = useState<{ role: string; body: string }[]>([]);
  const [uploadsByStep, setUploadsByStep] = useState<Record<number, string[]>>({});
  const [selectedByStep, setSelectedByStep] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploads = uploadsByStep[checkStep] ?? [];
  const selectedUpload = Math.min(selectedByStep[checkStep] ?? 0, Math.max(0, uploads.length - 1));
  const selectUpload = (index: number) =>
    setSelectedByStep((prev) => ({ ...prev, [checkStep]: index }));
  const addUploads = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const urls = Array.from(files).map((file) => URL.createObjectURL(file));
    setUploadsByStep((prev) => ({ ...prev, [checkStep]: [...(prev[checkStep] ?? []), ...urls] }));
  };
  const removeUpload = (index: number) => {
    setUploadsByStep((prev) => ({
      ...prev,
      [checkStep]: (prev[checkStep] ?? []).filter((_, i) => i !== index)
    }));
    setSelectedByStep((prev) => {
      const current = prev[checkStep] ?? 0;
      const next = current > index ? current - 1 : current;
      return { ...prev, [checkStep]: Math.max(0, next) };
    });
  };
  const [orientOpen, setOrientOpen] = useState(true);
  const [reqTabs, setReqTabs] = useState<ReqTab[]>(BASE_REQ_TABS);
  const nextTabId = useRef(1);
  const addReqTab = () => {
    setReqTabs((tabs) => [
      ...tabs,
      { id: `custom-${nextTabId.current++}`, label: "新規項目", type: "single", removable: true }
    ]);
  };
  const removeReqTab = (index: number) => {
    setReqTabs((tabs) => tabs.filter((_, i) => i !== index));
  };
  const [refItems, setRefItems] = useState<number[]>([]);
  const nextRefId = useRef(1);
  const addRefItem = () => setRefItems((items) => [...items, nextRefId.current++]);
  const removeRefItem = (id: number) => setRefItems((items) => items.filter((item) => item !== id));

  const [specSize, specFormat, specDpi] = asset.format.split(" / ");
  const phase = CHECK_PHASES[checkStep];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="modal-backdrop asset-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`asset-modal ${initialTab === "check" ? "asset-modal--check" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="asset-modal-head">
          <div className="asset-modal-head-left">
            <span className="asset-modal-kicker">{initialTab === "req" ? "要件指定" : "チェック"}</span>
          </div>
        </header>

        <div className="asset-modal-body">
          {initialTab === "req" ? (
            <div className="req-view">
              <div className="field req-title-field">
                <span className="field-label">対象画像（タイトル）</span>
                <input className="modal-input" defaultValue={asset.title} />
              </div>

              <div className="req-2pane">
                {/* オリエン（参照・折りたたみ） */}
                <aside className="orient-pane">
                  <button
                    type="button"
                    className="orient-toggle"
                    onClick={() => setOrientOpen((open) => !open)}
                    aria-expanded={orientOpen}
                  >
                    <span className="pane-head">
                      <span className="orient-title">オリエン</span>
                      <span className="tag-pink">依頼内容</span>
                      <span className="muted-inline">クリックで開閉</span>
                    </span>
                    <span className={`orient-caret ${orientOpen ? "open" : ""}`}>▾</span>
                  </button>

                  {orientOpen && (
                    <div className="orient-body">
                      <div className="field">
                        <span className="field-label">指定スペック</span>
                        <div className="spec-chips">
                          <div className="spec-chip">
                            <span>出力サイズ</span>
                            <b>{specSize}</b>
                          </div>
                          <div className="spec-chip">
                            <span>形式</span>
                            <b>{specFormat}</b>
                          </div>
                          <div className="spec-chip">
                            <span>DPI</span>
                            <b>{specDpi?.replace("dpi", "")}</b>
                          </div>
                          <span className="spec-note">※ スペックは「画像一覧」で設定</span>
                        </div>
                      </div>

                      <div className="field">
                        <span className="field-label">概要コメント</span>
                        <textarea
                          className="modal-input orient-comment"
                          rows={4}
                          defaultValue="ECトップのメインKV。春の新作トップスを主役に、休日の朝の外出シーンを想起させる明るく軽やかなトーンで。全身が無理なく収まり、上下に余白を確保（バナー転用前提）。モデルは20代後半・ナチュラルメイク、屋外の並木道で自然光を希望。"
                        />
                      </div>

                      <div className="field">
                        {refItems.map((id) => (
                          <div className="ref-card" key={id}>
                            <div className="ref-card-head">
                              <span className="tag-purple">参考画像</span>
                              <button
                                type="button"
                                className="ref-card-remove"
                                onClick={() => removeRefItem(id)}
                                aria-label="この参考画像を削除"
                              >
                                ×
                              </button>
                            </div>
                            <div className="ref-card-body">
                              <UploadSlots />
                              <textarea
                                className="req-comment"
                                rows={3}
                                placeholder="この参考画像へのコメント"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="button ghost sm ref-add-btn"
                          onClick={addRefItem}
                        >
                          ＋ 参考画像＋コメントを追加
                        </button>
                      </div>
                    </div>
                  )}
                </aside>

                {/* 要件指定書（作成） */}
                <div className="req-pane">
                  <div className="pane-head">
                    <h3>要件指定書</h3>
                    <span className="muted-inline">この内容をデザイナーへ渡します</span>
                  </div>

                  <div className="req-items-head">
                    <div className="req-items-title">
                      <h4>要件（画像＋コメント）</h4>
                    </div>
                    <div className="req-items-actions">
                      <button className="button ghost sm" type="button">
                        ⬇ 画像DL
                      </button>
                      <div className="model-count">
                        <span>モデル人数</span>
                        <div className="count-seg">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={modelCount === n ? "on" : ""}
                              onClick={() => setModelCount(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button className="button ghost sm" type="button" onClick={addReqTab}>
                        ＋ 項目を追加
                      </button>
                    </div>
                  </div>

                  {reqTabs.map((tabItem, index) => (
                    <div
                      key={tabItem.id}
                      className={`req-item ${tabItem.type === "coordinate" ? "req-item-client" : ""}`}
                    >
                      <div className="req-item-label">
                        <span className="req-item-title">{tabItem.label}</span>
                        {tabItem.type === "coordinate" && (
                          <>
                            <span className="tag-pink">クライアント入力</span>
                            <span className="muted-inline">正面のみ表示・クリックで裏/横/ディテール</span>
                          </>
                        )}
                        {tabItem.removable && (
                          <button
                            type="button"
                            className="req-item-remove"
                            onClick={() => removeReqTab(index)}
                            aria-label={`${tabItem.label}を削除`}
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {tabItem.type === "overall" ? (
                        <div className="req-item-body">
                          <UploadSlots />
                          <textarea className="req-comment" rows={3} placeholder="この画像へのコメント" />
                        </div>
                      ) : (
                        <ReqModelRows count={modelCount} kind={tabItem.type} />
                      )}
                    </div>
                  ))}

                </div>
              </div>
            </div>
          ) : (
            <div className="check-view">
              <div className="check-steps">
                {CHECK_PHASES.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={`check-step ${checkStep === index ? "on" : ""} ${
                      index < checkStep ? "done" : ""
                    }`}
                    onClick={() => setCheckStep(index)}
                  >
                    <span className="step-dot">{index < checkStep ? "✓" : index + 1}</span>
                    <span className="step-label">
                      <b>{item.step}</b>
                      <small>{item.group}</small>
                    </span>
                  </button>
                ))}
              </div>

              <div className="check-cols">
                <section className="modal-card check-col">
                  <span className="field-label">{phase.targetLabel}</span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(event) => {
                      addUploads(event.target.files);
                      event.target.value = "";
                    }}
                  />

                  {uploads.length === 0 ? (
                    <div
                      className="upload-dropzone"
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        addUploads(event.dataTransfer.files);
                      }}
                    >
                      <span className="upload-icon" aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path
                            d="M12 16V4m0 0L7 9m5-5 5 5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <p className="upload-title">{phase.uploadCta}</p>
                      <p className="upload-hint">
                        ここにドラッグ＆ドロップ、またはクリックして選択（PNG / JPG・複数可）
                      </p>
                    </div>
                  ) : (
                    <div
                      className="upload-gallery"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        addUploads(event.dataTransfer.files);
                      }}
                    >
                      <div className="upload-main">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploads[selectedUpload]}
                          alt={`選択中の画像 ${selectedUpload + 1}`}
                        />
                      </div>
                      <div className="upload-thumbs">
                        {uploads.map((src, index) => (
                          <button
                            type="button"
                            className={`upload-thumb ${index === selectedUpload ? "on" : ""}`}
                            key={src}
                            onClick={() => selectUpload(index)}
                            aria-label={`画像${index + 1}を選択`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`アップロード画像 ${index + 1}`} />
                            <span
                              className="upload-thumb-x"
                              role="button"
                              aria-label={`画像${index + 1}を削除`}
                              onClick={(event) => {
                                event.stopPropagation();
                                removeUpload(index);
                              }}
                            >
                              ×
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="upload-thumb-add"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="画像を追加"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section className="modal-card check-col">
                  {phase.points.length > 0 && (
                    <div className="check-points">
                      <span className="field-label">確認ポイント</span>
                      <ul>
                        {phase.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="check-group">
                    <span className="field-label">{phase.memoLabel}</span>
                    <textarea className="modal-input" rows={4} placeholder={phase.memoPlaceholder} />
                    <div className="check-notify">
                      <button className="button ghost sm" type="button">
                        {phase.notify}
                      </button>
                      <span className="muted-inline">アップロード・伝達事項の記載後に通知</span>
                    </div>
                  </div>

                  <div className="check-group">
                    <span className="field-label">{phase.judgeLabel}</span>
                    <div className="judge-row">
                      <div className="judge-seg">
                        <button
                          type="button"
                          className={judge === "要修正" ? "on" : ""}
                          onClick={() => setJudge("要修正")}
                        >
                          要修正
                        </button>
                        <button
                          type="button"
                          className={judge === "OK" ? "on" : ""}
                          onClick={() => setJudge("OK")}
                        >
                          OK
                        </button>
                      </div>
                      <span className="judge-status">{judge ?? "未選択"}</span>
                    </div>

                    {judge === "要修正" && (
                      <div className="fix-request">
                        {fixComments.map((comment, index) => (
                          <div className="fix-comment" key={index}>
                            <span className="fix-comment-role">{comment.role}</span>
                            <span className="fix-comment-body">{comment.body}</span>
                          </div>
                        ))}
                        <textarea
                          className="modal-input"
                          rows={4}
                          placeholder="修正してほしい点を記入"
                          value={fixComment}
                          onChange={(event) => setFixComment(event.target.value)}
                        />
                        <div className="fix-actions">
                          <button
                            className="button ghost sm"
                            type="button"
                            onClick={() => {
                              const body = fixComment.trim();
                              if (!body) return;
                              setFixComments((prev) => [
                                ...prev,
                                { role: phase.judgeLabel.replace("判定", ""), body }
                              ]);
                              setFixComment("");
                            }}
                          >
                            送信
                          </button>
                        </div>
                        <button className="button fix-reupload" type="button">
                          デザイナー：再修正版を再アップロード
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>

        <footer className="asset-modal-foot">
          {initialTab === "req" ? (
            <>
              <button className="button ghost" type="button" onClick={onClose}>
                閉じる
              </button>
              <button className="button primary" type="button">
                要件を確定して通知（デザイナーへ）
              </button>
            </>
          ) : (
            <>
              {phase.ctaNote && <span className="muted-inline">{phase.ctaNote}</span>}
              <button className="button ghost" type="button" onClick={onClose}>
                閉じる
              </button>
              <button
                className="button primary"
                type="button"
                onClick={() => setCheckStep((step) => Math.min(step + 1, CHECK_PHASES.length - 1))}
              >
                {phase.deliver ? phase.cta : "保存して次へ"}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}

function ImageLightbox({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="modal-backdrop lightbox-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="lightbox"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="lightbox-head">
          <h2>{asset.title}</h2>
          <button className="button ghost sm" type="button" onClick={onClose}>
            ✕ 閉じる
          </button>
        </header>
        <div className="lightbox-image">
          <span className="lightbox-badge">
            {asset.progress > 0 ? `${asset.progress}%` : "未生成"}
          </span>
        </div>
        <footer className="lightbox-foot">
          ステータス：{asset.status}／納品期限：{toDateValue(asset.due)}
        </footer>
      </section>
    </div>
  );
}

function Overview({
  assets,
  onOpenAsset,
  onPreview
}: {
  assets: Asset[];
  onOpenAsset: (assetId: string, tab: "req" | "gen" | "check") => void;
  onPreview: (assetId: string) => void;
}) {
  const [view, setView] = useState<"list" | "gallery">("list");
  const [bulkSpec, setBulkSpec] = useState({
    size: SPEC_SIZES[0],
    format: SPEC_FORMATS[0],
    dpi: SPEC_DPIS[0]
  });
  const [specOverrides, setSpecOverrides] = useState<
    Record<string, { size: string; format: string; dpi: string }>
  >({});

  function specFor(asset: Asset) {
    if (specOverrides[asset.id]) return specOverrides[asset.id];
    const [size, format, dpi] = asset.format.split(" / ");
    return { size, format, dpi: dpi?.replace("dpi", "") ?? "" };
  }

  function updateSpec(asset: Asset, patch: Partial<{ size: string; format: string; dpi: string }>) {
    setSpecOverrides((prev) => ({
      ...prev,
      [asset.id]: { ...specFor(asset), ...patch }
    }));
  }

  function applyBulkSpec() {
    setSpecOverrides((prev) => {
      const next = { ...prev };
      assets.forEach((asset) => {
        next[asset.id] = { ...bulkSpec };
      });
      return next;
    });
  }

  return (
    <div className="overview-layout">
      {/* 画像（一覧 / プレビュー 切替・枠なし） */}
      <section className="asset-list-panel">
        <div className="section-title-row">
          <div className="seg compact">
            <button className={view === "list" ? "on" : ""} type="button" onClick={() => setView("list")}>
              一覧
            </button>
            <button
              className={view === "gallery" ? "on" : ""}
              type="button"
              onClick={() => setView("gallery")}
            >
              プレビュー
            </button>
          </div>
          <div className="section-title-actions">
            {view === "gallery" && <button className="button ghost sm">⬇ 一括ダウンロード</button>}
          </div>
        </div>

        <div className="table-top-bar">
          {view === "list" && (
          <div className="bulk-spec-bar">
            <span className="bulk-spec-label">指定スペック一括：</span>
            <select
              value={bulkSpec.size}
              onChange={(event) => setBulkSpec((spec) => ({ ...spec, size: event.target.value }))}
            >
              {SPEC_SIZES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={bulkSpec.format}
              onChange={(event) => setBulkSpec((spec) => ({ ...spec, format: event.target.value }))}
            >
              {SPEC_FORMATS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={bulkSpec.dpi}
              onChange={(event) => setBulkSpec((spec) => ({ ...spec, dpi: event.target.value }))}
            >
              {SPEC_DPIS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button className="button ghost sm bulk-spec-apply" type="button" onClick={applyBulkSpec}>
              全画像に適用
            </button>
          </div>
          )}
          <button className="button primary sm table-add-btn" type="button">
            ＋ 追加
          </button>
        </div>

        {view === "list" && (
          <div className="asset-table-wrap">
          <table className="asset-table">
            <colgroup>
              <col className="col-id" />
              <col className="col-title" />
              <col className="col-date" />
              <col className="col-date" />
              <col className="col-assignee" />
              <col className="col-spec" />
              <col className="col-status" />
              <col className="col-progress" />
              <col className="col-ops" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>画像タイトル</th>
                <th>生成確認</th>
                <th>納品期限</th>
                <th>担当（生成/レタッチ）</th>
                <th>指定スペック</th>
                <th>ステータス</th>
                <th>進行（要件/生成/チェック）</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={asset.id}>
                  <td>#{index + 1}</td>
                  <td>
                    <input className="cell-title-input" defaultValue={asset.title} />
                  </td>
                  <td>
                    <input type="date" className="cell-date" />
                  </td>
                  <td>
                    <input type="date" className="cell-date" defaultValue={toDateValue(asset.due)} />
                  </td>
                  <td>
                    <div className="assignee-selects">
                      <div className="assignee-row">
                        <span>生成</span>
                        <select defaultValue={asset.owner}>
                          {ASSIGNEE_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="assignee-row">
                        <span>レタッチ</span>
                        <select defaultValue="未割当">
                          {ASSIGNEE_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="spec-selects">
                      <select
                        value={specFor(asset).size}
                        onChange={(event) => updateSpec(asset, { size: event.target.value })}
                      >
                        {SPEC_SIZES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <select
                        value={specFor(asset).format}
                        onChange={(event) => updateSpec(asset, { format: event.target.value })}
                      >
                        {SPEC_FORMATS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <select
                        value={specFor(asset).dpi}
                        onChange={(event) => updateSpec(asset, { dpi: event.target.value })}
                      >
                        {SPEC_DPIS.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td>
                    <Badge tone={CHECK_STATUS_LABEL[asset.status].tone}>
                      {CHECK_STATUS_LABEL[asset.status].label}
                    </Badge>
                  </td>
                  <td>
                    <div className="progress-actions">
                      <button
                        className="button ghost sm"
                        type="button"
                        onClick={() => onOpenAsset(asset.id, "req")}
                      >
                        要件指定
                      </button>
                      <button
                        className="button ghost sm"
                        type="button"
                        onClick={() => onOpenAsset(asset.id, "gen")}
                      >
                        生成
                      </button>
                      <button
                        className="button ghost sm"
                        type="button"
                        onClick={() => onOpenAsset(asset.id, "check")}
                      >
                        チェック
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="row-ops">
                      <button
                        type="button"
                        className="has-tooltip"
                        data-tooltip="この行を複製して追加"
                        aria-label="この行を複製して追加"
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        className="has-tooltip"
                        data-tooltip="この画像を削除"
                        aria-label="この画像を削除"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {view === "gallery" && (
          <div className="asset-preview-grid">
          {assets.map((asset, index) => (
            <button className="asset-preview-card" key={asset.id} onClick={() => onPreview(asset.id)}>
              <div className="asset-preview-thumb">
                <span>{asset.progress > 0 ? `${asset.progress}%` : "未生成"}</span>
              </div>
              <strong>
                #{index + 1} {asset.title}
              </strong>
              <small>{asset.status}</small>
            </button>
          ))}
          </div>
        )}
      </section>
    </div>
  );
}

function getProjectSchedule(project: Project) {
  const schedules: Record<string, string> = {
    p1: "オリエン 4/15 → 生成 4/22 → 選定 4/28 → レタッチ 5/15 → 納品 5/30",
    p2: "要件確定 3/20 → 生成 3/28 → クライアント確認 4/10 → 納品 4/25",
    p3: "オリエン 5/10 → 要件整理 5/20 → 生成 6/05 → レタッチ 6/25 → 納品 7/05",
    p4: "撮り直し 2/10 → 生成 2/20 → レタッチ 3/05 → 納品 3/15"
  };

  return schedules[project.id] ?? `${project.period}内で、要件整理 → 生成 → 確認 → レタッチ → 納品まで進行`;
}

function getModelSummary(projectId: string) {
  const summaries: Record<string, { women: number; men: number }> = {
    p1: { women: 2, men: 1 },
    p2: { women: 1, men: 0 },
    p3: { women: 3, men: 2 },
    p4: { women: 1, men: 1 }
  };

  return summaries[projectId] ?? { women: 0, men: 0 };
}

function ModelGenderGroup({ label, count }: { label: string; count: number }) {
  return (
    <div className="model-gender">
      <span className="model-gender-label">{label}</span>
      <div className="model-card-row">
        {Array.from({ length: count }).map((_, index) => (
          <div className="model-card" key={`${label}-${index}`}>
            <button className="model-card-remove" type="button" aria-label="モデルを削除">
              ×
            </button>
          </div>
        ))}
      </div>
      <button className="button ghost model-add-btn" type="button">
        ＋ モデルを追加
      </button>
    </div>
  );
}

function Direction({
  assets,
  selectedAsset,
  onSelectAsset
}: {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (assetId: string) => void;
}) {
  return (
    <div className="asset-layout">
      <AssetRail assets={assets} selectedAsset={selectedAsset} onSelectAsset={onSelectAsset} />

      <section className="sub-panel asset-detail">
        <div className="asset-title-row">
          <div>
            <h3>{selectedAsset.title}</h3>
          </div>
          <Badge tone={statusTone[selectedAsset.status]}>{selectedAsset.status}</Badge>
        </div>

        <div className="preview-grid">
          <div className="mock-image large">
            <span>{selectedAsset.title}</span>
          </div>
          <div className="direction-summary">
            <Info label="形式" value={selectedAsset.format} />
            <Info label="期日" value={selectedAsset.due} />
            <Info label="担当" value={selectedAsset.owner} />
          </div>
        </div>

        <div className="brief-block">
          <h4>制作意図</h4>
          <p>{selectedAsset.concept}</p>
        </div>

        <div className="rules">
          <RuleList title="必須条件" items={selectedAsset.must} />
          <RuleList title="避けること" items={selectedAsset.ng} />
        </div>

        <div className="brief-block">
          <h4>参照素材</h4>
          <div className="chips muted">
            {selectedAsset.references.map((reference) => (
              <span key={reference}>{reference}</span>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="button secondary">下書き保存</button>
          <button className="button">要件を確定して通知</button>
        </div>
      </section>
    </div>
  );
}

function Review({
  assets,
  selectedAsset,
  onSelectAsset
}: {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (assetId: string) => void;
}) {
  return (
    <div className="asset-layout">
      <AssetRail assets={assets} selectedAsset={selectedAsset} onSelectAsset={onSelectAsset} />

      <section className="sub-panel asset-detail">
        <div className="asset-title-row">
          <div>
            <h3>{selectedAsset.title}</h3>
          </div>
          <Badge tone={statusTone[selectedAsset.status]}>{selectedAsset.status}</Badge>
        </div>

        <div className="review-grid">
          {["生成案 A", "生成案 B", "レタッチ後"].map((label, index) => (
            <div className="candidate" key={label}>
              <div className={`mock-image hue-${index}`}>
                <span>{label}</span>
              </div>
              <div className="candidate-foot">
                <strong>{label}</strong>
                <span>{index === 2 ? "最終候補" : "比較中"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="check-actions">
          <button className="button secondary">要修正</button>
          <button className="button secondary">社内OK</button>
          <button className="button">クライアントへ送信</button>
        </div>

        <div className="comments">
          <h4>コメント</h4>
          {selectedAsset.comments.map((comment) => (
            <article key={`${comment.from}-${comment.time}`}>
              <div>
                <strong>{comment.from}</strong>
                <Badge tone={comment.role === "クライアント" ? "tone-purple" : "tone-blue"}>{roleDisplay(comment.role)}</Badge>
              </div>
              <p>{comment.body}</p>
              <time>{comment.time}</time>
            </article>
          ))}
          <div className="comment-box">
            <input placeholder="修正指示・確認コメントを入力" />
            <button className="button">送信</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AssetRail({
  assets,
  selectedAsset,
  onSelectAsset
}: {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (assetId: string) => void;
}) {
  return (
    <aside className="asset-rail">
      <div className="asset-rail-head">
        <span>画像</span>
        <strong>{assets.length}</strong>
      </div>
      {assets.map((asset) => (
        <button
          className={`asset-row ${asset.id === selectedAsset.id ? "selected" : ""}`}
          key={asset.id}
          onClick={() => onSelectAsset(asset.id)}
        >
          <div className="thumb" />
          <div>
            <strong>{asset.title}</strong>
            <span>{asset.due} / {asset.owner}</span>
          </div>
        </button>
      ))}
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function roleDisplay(role: string) {
  const labels: Record<string, string> = {
    クライアント: "クライアント",
    レタッチ: "レタッチ",
    下書き: "下書き",
    ディレクター: "ディレクター",
    顧客窓口: "顧客窓口"
  };

  return labels[role] ?? role;
}

function RuleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rule-list">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
