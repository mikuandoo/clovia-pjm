"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProjectStatus = "要件整理" | "生成中" | "確認中" | "納品済";
type AssetStatus = "未着手" | "要件確定" | "生成確認" | "レタッチ中" | "納品OK";
type TabKey = "overview" | "direction" | "review";
type MemberRole = "ディレクター" | "デザイナー（生成）" | "レタッチャー" | "CS担当";
type ProjectFilter = "all" | "active" | "done";
type AppView = "production" | "project";
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

type ActionItem = {
  id: string;
  projectId: string;
  assetId?: string;
  title: string;
  context: string;
  owner: string;
  due: string;
  tone: "danger" | "warning" | "normal";
  tab: TabKey;
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
  {
    id: "a1",
    projectId: "p1",
    title: "メインビジュアル（縦）",
    format: "2000×2500 / JPG / 350dpi",
    due: "4/24",
    owner: "佐藤 美咲",
    status: "生成確認",
    progress: 64,
    concept:
      "休日の朝の外出シーン。20代後半モデル、ナチュラルメイク、屋外の並木道、自然光。上下に余白を確保してバナー転用可能にする。",
    must: ["トップスの素材感が分かる", "全身が無理なく収まる", "春らしい自然光", "コピー用の余白を確保"],
    ng: ["暗い背景", "過度な肌補正", "商品色が変わる加工", "モデルの表情が作り込みすぎ"],
    references: ["昨季KV_縦.jpg", "並木道_自然光.png", "モデル表情参考.pdf"],
    comments: [
      {
        from: "川村 様",
        role: "クライアント",
        body: "1案目は少しEC感が強いので、もう少しブランド広告寄りにしたいです。",
        time: "今日 10:24"
      },
      {
        from: "前田 涼",
        role: "ディレクター",
        body: "背景を整理しつつ、トップスの質感は残す方向で再生成します。",
        time: "今日 10:42"
      }
    ]
  },
  {
    id: "a2",
    projectId: "p1",
    title: "メインビジュアル（横）",
    format: "2400×1350 / JPG / 350dpi",
    due: "4/24",
    owner: "佐藤 美咲",
    status: "要件確定",
    progress: 42,
    concept:
      "横位置バナー。左に被写体、右にコピー余白。屋外・自然光で爽やかに、視線は画面外へ向ける。",
    must: ["左に被写体", "右側に余白", "スマホ表示でも商品が認識できる"],
    ng: ["中央配置", "背景が情報過多", "コピー領域への被り"],
    references: ["横バナー構図.jpg", "SS広告参考.png"],
    comments: [
      {
        from: "今井 彩",
        role: "顧客窓口",
        body: "クライアント確認済み。コピー領域だけ広めに確保してください。",
        time: "昨日 16:10"
      }
    ]
  },
  {
    id: "a3",
    projectId: "p1",
    title: "商品アップ（トップス）",
    format: "1500×1875 / PNG / 300dpi",
    due: "4/26",
    owner: "高橋 健",
    status: "レタッチ中",
    progress: 78,
    concept:
      "トップスの素材と縫製ディテールが伝わる上半身寄り。白飛びを避け、生地の色味を正確に出す。",
    must: ["生地の凹凸", "襟元の縫製", "正確な色味", "清潔感"],
    ng: ["白飛び", "過度なコントラスト", "首元の不自然な補正"],
    references: ["素材寄り参考.jpg", "商品単体画像.png"],
    comments: [
      {
        from: "森 さやか",
        role: "レタッチ",
        body: "袖口の歪みを修正中。色味は商品画像に合わせます。",
        time: "今日 09:12"
      }
    ]
  },
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

function matchProjectFilter(project: Project, filter: ProjectFilter) {
  if (filter === "all") return true;
  if (filter === "done") return project.status === "納品済";
  return project.status !== "納品済";
}

function buildActionItems(projects: Project[], assets: Asset[]): ActionItem[] {
  const items: ActionItem[] = [];

  projects.forEach((project) => {
    if (project.status === "納品済") return;
    items.push({
      id: `project-${project.id}`,
      projectId: project.id,
      title:
        project.status === "要件整理"
          ? "画像別の要件を確定"
          : project.status === "確認中"
            ? "クライアント確認を回収"
            : "生成・選定状況を確認",
      context: project.name,
      owner: project.owner,
      due: project.period.split(" - ")[1] ?? project.period,
      tone: project.risk === "高" ? "danger" : project.status === "確認中" ? "warning" : "normal",
      tab: project.status === "要件整理" ? "direction" : "review"
    });
  });

  assets.forEach((asset) => {
    if (asset.status !== "生成確認" && asset.status !== "レタッチ中") return;
    const project = projects.find((candidate) => candidate.id === asset.projectId);
    if (!project) return;

    items.push({
      id: `asset-${asset.id}`,
      projectId: asset.projectId,
      assetId: asset.id,
      title: asset.status === "生成確認" ? "生成案をチェック" : "レタッチ後をチェック",
      context: `${project.name} / ${asset.title}`,
      owner: asset.owner,
      due: asset.due,
      tone: asset.status === "レタッチ中" ? "warning" : "normal",
      tab: "review"
    });
  });

  const rank = { danger: 0, warning: 1, normal: 2 };
  return items.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
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
    view: route.view === "project" ? "project" : "production",
    projectId,
    assetId,
    tab: route.tab ?? fallback?.tab ?? "overview",
    filter: route.filter ?? fallback?.filter ?? "all",
    viewer: route.viewer ?? fallback?.viewer ?? "internal"
  };
}

function routeFromSearch(search: string, projects: Project[], assets: Asset[], fallback?: RouteState) {
  const params = new URLSearchParams(search);
  const view = params.get("view") === "project" ? "project" : "production";
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>(initialMemberGroups);
  const [memberDrafts, setMemberDrafts] = useState<Record<MemberRole, string>>({
    ディレクター: "",
    "デザイナー（生成）": "",
    レタッチャー: "",
    CS担当: ""
  });
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>(initialProjectDraft);
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
    setIsMemberModalOpen(false);
    setIsProjectModalOpen(false);
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
  const actionItems = useMemo(() => buildActionItems(projectList, assetList), [assetList, projectList]);

  function openProject(projectId: string, nextTab: TabKey = "overview", assetId?: string) {
    const nextAssets = assetList.filter((asset) => asset.projectId === projectId);
    writeRoute({
      view: "project",
      projectId,
      assetId: assetId ?? nextAssets[0]?.id ?? assetList[0].id,
      tab: nextTab
    });
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

  function resetDemo() {
    const nextRoute: RouteState = {
      view: "production",
      projectId: initialProjects[0].id,
      assetId: initialAssets[0].id,
      tab: "overview",
      filter: "all",
      viewer: "internal"
    };

    projectListRef.current = initialProjects;
    assetListRef.current = initialAssets;
    setProjectList(initialProjects);
    setAssetList(initialAssets);
    applyRoute(nextRoute);
    window.history.replaceState(null, "", routeToUrl(nextRoute));
    setMemberGroups(initialMemberGroups);
    setMemberDrafts({
      ディレクター: "",
      "デザイナー（生成）": "",
      レタッチャー: "",
      CS担当: ""
    });
    setProjectDraft(initialProjectDraft);
  }

  const totalAssets = projectList.reduce((sum, project) => sum + project.volume, 0);
  const doneAssets = projectList.reduce((sum, project) => sum + project.done, 0);
  const waitingReviews = assetList.filter((asset) => asset.status === "生成確認" || asset.status === "レタッチ中").length;

  return (
    <main className="shell">
      <section className="app">
        <header className="topbar">
          <div className="brand">
            <span className="brand-dot" />
            Clovia
          </div>
          <button className="button ghost sm" onClick={resetDemo}>
            リセット
          </button>
        </header>

        {appView === "production" ? (
          <>
            <section className="head">
              <div>
                <div className="scope-row">
                  <span className="scope-pill internal">社内専用</span>
                  <span className="sub">Cloverseだけが見る全案件ダッシュボード</span>
                </div>
                <h1>制作管理</h1>
                <p>全案件を横断して、進行・滞留・確認待ち・リスクを確認します。案件を開くとクライアント共有前提の案件管理へ移動します。</p>
              </div>
              <div className="top-actions">
                <button className="button ghost sm" onClick={() => setIsMemberModalOpen(true)}>
                  メンバー管理
                </button>
                <button className="button primary sm" onClick={() => setIsProjectModalOpen(true)}>
                  プロジェクト追加
                </button>
              </div>
            </section>

            <section className="stats">
              <Metric label="進行案件" value={`${projectList.length}件`} note="Cloverse管理" />
              <Metric label="制作画像" value={`${doneAssets}/${totalAssets}`} note="完了 / 総数" />
              <Metric label="確認待ち" value={`${waitingReviews}件`} note="社内・クライアント" />
            </section>

            <section className="ops-grid">
              <div className="panel action-panel">
                <div className="panel-head">
                  <div>
                    <h2>要対応</h2>
                  </div>
                  <span className="count">{actionItems.length}</span>
                </div>
                <div className="action-list">
                  {actionItems.map((item) => (
                    <button className={`action-item ${item.tone}`} key={item.id} onClick={() => openProject(item.projectId, item.tab, item.assetId)}>
                      <span>{item.due}</span>
                      <strong>{item.title}</strong>
                      <p>{item.context}</p>
                      <small>{item.owner}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div>
                    <h2>案件一覧</h2>
                  </div>
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
                </div>

                <div className="project-stack management-list">
                  {filteredProjectList.map((project) => (
                    <button className="project-card" key={project.id} onClick={() => openProject(project.id)}>
                      <div className="project-card-top">
                        <strong>{project.name}</strong>
                        <Badge tone={statusTone[project.status]}>{project.status}</Badge>
                      </div>
                      <p>ブランド：<b>{project.client}</b></p>
                      <p>ステータス：<b>{project.summary}</b></p>
                      <div className="progress-row">
                        <div className="progress">
                          <span style={{ width: `${(project.done / project.volume) * 100}%` }} />
                        </div>
                        <small>
                          {project.done}/{project.volume}
                        </small>
                      </div>
                      <div className="meta-row">
                        <span>担当：{project.owner}</span>
                        <span>リスク：{project.risk}</span>
                      </div>
                    </button>
                  ))}
                  {!filteredProjectList.length && (
                    <div className="empty-state">
                      <strong>該当する案件がありません</strong>
                      <p>別のステータスを選択してください。</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="head project-head">
              <div>
                <button className="button ghost sm" onClick={() => writeRoute({ view: "production" })}>
                  制作管理に戻る
                </button>
                <div className="scope-row">
                  <span className="scope-pill shared">社内・クライアント共有</span>
                  <span className="sub">該当クライアントは自社案件のみ閲覧</span>
                </div>
                <h1>案件管理</h1>
                <p>案件概要、制作画像、要件整理、チェックをこの案件単位で管理します。</p>
              </div>
              <div className="view-toggle">
                <button className={viewerMode === "internal" ? "on" : ""} onClick={() => writeRoute({ viewer: "internal" })}>
                  社内表示
                </button>
                <button className={viewerMode === "client" ? "on" : ""} onClick={() => writeRoute({ viewer: "client" })}>
                  クライアント表示
                </button>
              </div>
            </section>

            <section className="panel detail">
              <div className="detail-hero">
                <div>
                  <div className="hero-row">
                    <Badge tone={statusTone[selectedProject.status]}>{selectedProject.status}</Badge>
                    <span>{selectedProject.client}</span>
                    <span>{viewerMode === "internal" ? "社内確認用" : "クライアント共有用"}</span>
                  </div>
                  <h2>{selectedProject.name}</h2>
                  <p>{selectedProject.summary}</p>
                </div>
                <div className="deadline">
                  <span>納期</span>
                  <strong>{selectedProject.period}</strong>
                </div>
              </div>

              <div className="tabs">
                <TabButton active={tab === "overview"} onClick={() => writeRoute({ tab: "overview" })}>
                  案件概要
                </TabButton>
                <TabButton active={tab === "direction"} onClick={() => writeRoute({ tab: "direction" })}>
                  画像要件
                </TabButton>
                <TabButton active={tab === "review"} onClick={() => writeRoute({ tab: "review" })}>
                  チェック
                </TabButton>
              </div>

              {tab === "overview" && (
                <Overview
                  project={selectedProject}
                  assets={projectAssets}
                  onOpenAsset={(assetId) => {
                    writeRoute({ tab: "direction", assetId });
                  }}
                />
              )}
              {tab === "direction" && (
                <Direction
                  assets={projectAssets}
                  selectedAsset={selectedAsset}
                  onSelectAsset={(assetId) => writeRoute({ assetId })}
                />
              )}
              {tab === "review" && (
                <Review
                  assets={projectAssets}
                  selectedAsset={selectedAsset}
                  onSelectAsset={(assetId) => writeRoute({ assetId })}
                />
              )}
            </section>
          </>
        )}

        {isMemberModalOpen && (
          <MemberModal
            groups={memberGroups}
            drafts={memberDrafts}
            onDraftChange={(role, value) => setMemberDrafts((drafts) => ({ ...drafts, [role]: value }))}
            onAdd={addMember}
            onRemove={removeMember}
            onClose={() => setIsMemberModalOpen(false)}
          />
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
      </section>
    </main>
  );
}

function memberRole(groups: MemberGroup[], name: string) {
  return groups.find((group) => group.members.includes(name))?.role;
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

function MemberModal({
  groups,
  drafts,
  onDraftChange,
  onAdd,
  onRemove,
  onClose
}: {
  groups: MemberGroup[];
  drafts: Record<MemberRole, string>;
  onDraftChange: (role: MemberRole, value: string) => void;
  onAdd: (role: MemberRole) => void;
  onRemove: (role: MemberRole, name: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h2 id="member-modal-title">全社メンバー管理</h2>
            <p>ここで登録したメンバーが、各プロジェクトの「PJメンバー」割り当て候補になります。</p>
          </div>
          <button className="button ghost modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>

        <div className="member-groups">
          {groups.map((group) => (
            <section className="member-group" key={group.role}>
              <div className="member-group-title">
                <h3>{group.role}</h3>
                <span>{group.members.length}名</span>
              </div>

              <div className="member-chip-list">
                {group.members.map((member) => (
                  <span className="member-chip" key={member}>
                    {member}
                    <button onClick={() => onRemove(group.role, member)} aria-label={`${member}を削除`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <form
                className="member-add"
                onSubmit={(event) => {
                  event.preventDefault();
                  onAdd(group.role);
                }}
              >
                <input
                  value={drafts[group.role]}
                  onChange={(event) => onDraftChange(group.role, event.target.value)}
                  placeholder="名前を追加"
                />
                <button className="button ghost" type="submit">
                  追加
                </button>
              </form>
            </section>
          ))}
        </div>
      </section>
    </div>
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

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
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

function Overview({
  project,
  assets,
  onOpenAsset
}: {
  project: Project;
  assets: Asset[];
  onOpenAsset: (assetId: string) => void;
}) {
  const modelSummary = getModelSummary(project.id);
  const schedule = getProjectSchedule(project);
  const links = getProjectLinks(project);

  return (
    <div className="overview-layout">
      <section className="sub-panel overview-main">
        <div className="section-title-row">
          <div>
            <h3>プロジェクト概要</h3>
          </div>
          <Badge tone={statusTone[project.status]}>{project.status}</Badge>
        </div>

        <div className="info-grid project-brief-grid">
          <Info label="プロジェクト名" value={project.name} />
          <Info label="ブランド名" value={project.client} />
          <Info label="窓口" value={project.contact} />
          <Info label="期間" value={project.period} />
          <Info label="ディレクター" value={project.owner} />
          <Info label="生成担当" value={project.designer} />
          <Info label="レタッチャー" value={project.retoucher} />
          <Info label="進行リスク" value={project.risk} />
        </div>

        <div className="overview-text-grid">
          <div>
            <h4>PJ背景 / クリエイティブ用途</h4>
            <p>{project.summary}</p>
          </div>
          <div>
            <h4>スケジュール</h4>
            <p>{schedule}</p>
          </div>
        </div>
      </section>

      <div className="overview-grid">
        <section className="sub-panel">
          <div className="section-title-row">
            <h3>関連資料</h3>
          </div>
          <div className="file-list">
            {project.materials.map((file) => (
              <div key={file}>
                <span>添付</span>
                <p>{file}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sub-panel">
          <div className="section-title-row">
            <h3>関連リンク</h3>
          </div>
          <div className="link-list">
            {links.map((link) => (
              <div key={link.label}>
                <span>{link.type}</span>
                <p>{link.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="overview-grid">
        <section className="sub-panel">
          <div className="section-title-row">
            <h3>モデル登録</h3>
          </div>
          <div className="model-grid">
            <ModelSlot label="女性モデル" value={modelSummary.women} />
            <ModelSlot label="男性モデル" value={modelSummary.men} />
          </div>
        </section>

        <section className="sub-panel">
          <div className="section-title-row">
            <h3>納品物</h3>
          </div>
          <div className="chips">
            {project.deliverables.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      </div>

      <section className="sub-panel">
        <div className="section-title-row">
          <div>
            <h3>画像一覧</h3>
          </div>
          <span className="muted-pill">{assets.length}枚</span>
        </div>

        <div className="asset-table-wrap">
          <table className="asset-table">
            <thead>
              <tr>
                <th>番号</th>
                <th>画像タイトル</th>
                <th>納品期限</th>
                <th>担当</th>
                <th>指定スペック</th>
                <th>ステータス</th>
                <th>進行</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={asset.id}>
                  <td>#{index + 1}</td>
                  <td>
                    <button onClick={() => onOpenAsset(asset.id)}>{asset.title}</button>
                  </td>
                  <td>{asset.due}</td>
                  <td>{asset.owner}</td>
                  <td>{asset.format}</td>
                  <td>
                    <Badge tone={statusTone[asset.status]}>{asset.status}</Badge>
                  </td>
                  <td>{asset.progress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sub-panel">
        <div className="section-title-row">
          <div>
            <h3>画像プレビュー</h3>
          </div>
        </div>

        <div className="asset-preview-grid">
          {assets.map((asset, index) => (
            <button className="asset-preview-card" key={asset.id} onClick={() => onOpenAsset(asset.id)}>
              <div className="asset-preview-thumb">
                <span>{asset.progress > 0 ? `${asset.progress}%` : "未生成"}</span>
              </div>
              <strong>#{index + 1} {asset.title}</strong>
              <small>{asset.status}</small>
            </button>
          ))}
        </div>
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

function getProjectLinks(project: Project) {
  return [
    { type: "公式", label: `${project.client} 公式サイト` },
    { type: "投稿", label: "過去投稿リファレンス" },
    { type: "掲載", label: `${project.name} 掲載予定ページ` }
  ];
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

function ModelSlot({ label, value }: { label: string; value: number }) {
  return (
    <div className="model-slot">
      <span>{label}</span>
      <strong>{value}名</strong>
      <p>{value > 0 ? "候補素材を登録済み" : "未登録"}</p>
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
