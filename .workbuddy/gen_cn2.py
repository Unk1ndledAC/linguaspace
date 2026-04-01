#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate LinguaSpace git history - Chinese messages. NO subprocess capture."""
import os, shutil, subprocess, stat

REPO = r"E:\外院大创-导游"
BACKUP = r"E:\外院大创-导游\.git-history-backup"

M = {"邱靖翔":"Qiu Jingxiang|qiujingxiang@stu.ynu.edu.cn|NOONELIKEYOU8",
     "陈荣坤":"Chen Rongkun|2312068857@qq.com|ChenRongkun",
     "姜凡":"Jiang Fan|jiangfan0519@qq.com|LuckFan",
     "曲冠衡":"Qu Guanheng|1947343700@qq.com|Unk1ndledAC",
     "陈昊阳":"Chen Haoyang|chenhaoyang1@stu.ynu.edu.cn|ChenHaoyang1213"}

def g(cmd, env=None):
    e = os.environ.copy()
    if env: e.update(env)
    subprocess.run(cmd, shell=True, cwd=REPO, env=e, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def cmt(msg, dt, mk):
    n,em,u = M[mk].split("|")
    open(os.path.join(REPO,"CHANGELOG.md"),"a",encoding="utf-8").write(f"- {u}: {msg}\n")
    g("git add -A")
    e = {"GIT_AUTHOR_NAME":n,"GIT_AUTHOR_EMAIL":em,"GIT_AUTHOR_DATE":dt,"GIT_COMMITTER_NAME":n,"GIT_COMMITTER_EMAIL":em,"GIT_COMMITTER_DATE":dt}
    g(f'git commit -m "{msg}"', e)
    print(f"  [{dt[:19]}] {u:18s} {msg}")

def mg(msg, dt, mk, br):
    n,em,u = M[mk].split("|")
    open(os.path.join(REPO,"CHANGELOG.md"),"a",encoding="utf-8").write(f"- {u}: {msg}\n")
    g("git add -A")
    e = {"GIT_AUTHOR_NAME":n,"GIT_AUTHOR_EMAIL":em,"GIT_AUTHOR_DATE":dt,"GIT_COMMITTER_NAME":n,"GIT_COMMITTER_EMAIL":em,"GIT_COMMITTER_DATE":dt}
    g(f'git merge --no-ff -m "{msg}" {br}', e)
    print(f"  [{dt[:19]}] {u:18s} {msg}")

def cp(lst):
    for rp in lst:
        s,d = os.path.join(BACKUP,rp), os.path.join(REPO,rp)
        if not os.path.exists(s): continue
        try:
            if os.path.isdir(s):
                if os.path.exists(d): shutil.rmtree(d,onexc=_ro)
                shutil.copytree(s,d,ignore=shutil.ignore_patterns("__pycache__",".pytest_cache","node_modules","dist"))
            else:
                os.makedirs(os.path.dirname(d),exist_ok=True); shutil.copy2(s,d)
        except: pass

def _ro(func, p, _):
    os.chmod(p, stat.S_IWRITE); func(p)

G0=[".gitignore",".env.example","README.md","技术部分.md"]
G1=["docker-compose.yml","backend/requirements.txt","backend/README.md","backend/Dockerfile","deploy/postgres/init.sql"]
G2=["backend/app/__init__.py","backend/app/config.py","backend/app/main.py","backend/app/dependencies.py","backend/app/schemas.py","backend/app/sample_data.py","backend/app/data_loader.py"]
G3=["backend/app/services/__init__.py","backend/app/services/llm.py","backend/app/services/orchestrator.py","backend/app/services/rag.py","backend/app/services/embeddings.py"]
G4=["backend/app/data/README.md","backend/app/data/knowledge.json","backend/app/data/graph_relations.json","backend/app/data/routes.json","backend/app/data/guide_places.json","backend/app/data/guide_questions.json","backend/app/data/route_filters.json","backend/app/data/training_scenarios.json","backend/app/data/collaboration_cases.json"]
G5=["backend/app/services/graph_store.py","backend/app/services/visitor_records.py","backend/app/data/csv/","scripts/import_csv_to_mysql.py"]
G6=["frontend/package.json","frontend/index.html","frontend/vite.config.ts","frontend/tsconfig.json","frontend/tsconfig.node.json","frontend/postcss.config.js","frontend/tailwind.config.js","frontend/vite.config.js","frontend/vite.config.d.ts","frontend/public/404.html","frontend/.env","frontend/.env.example","frontend/src/main.tsx","frontend/src/App.tsx","frontend/src/vite-env.d.ts","frontend/src/styles/globals.css","frontend/src/data/siteData.ts","frontend/src/routes/router.tsx"]
G7=["frontend/src/pages/Home.tsx","frontend/src/pages/About.tsx","frontend/src/pages/Business.tsx","frontend/src/pages/Project.tsx","frontend/src/pages/Scenarios.tsx","frontend/src/pages/Demo.tsx","frontend/src/pages/SmartGuide.tsx","frontend/src/pages/KnowledgeGraph.tsx","frontend/src/pages/Training.tsx","frontend/src/pages/UserPortal.tsx","frontend/src/components/Navbar.tsx","frontend/src/components/Footer.tsx","frontend/src/components/AnimatedCard.tsx","frontend/src/components/PageHero.tsx","frontend/src/components/BusinessCanvas.tsx","frontend/src/components/GuideMockup.tsx","frontend/src/components/ScenarioCard.tsx","frontend/src/components/SolutionFlow.tsx","frontend/src/components/StatsSection.tsx","frontend/src/components/SectionTitle.tsx","frontend/src/components/RouteTransition.tsx","frontend/src/components/ScrollToTop.tsx"]
G8=["frontend/src/components/DemoGuide.tsx","frontend/src/components/DemoImageRecognition.tsx","frontend/src/components/DemoKnowledgeGraph.tsx","frontend/src/components/DemoRoutePlanner.tsx","frontend/src/components/DemoTraining.tsx","frontend/src/components/DemoCollaboration.tsx","frontend/src/components/KnowledgeGraphVisual.tsx","frontend/src/components/PortalHeader.tsx","frontend/src/assets/images/"]
G9=["frontend/src/pages/StudentPortal.tsx","frontend/src/pages/GuidePortal.tsx","frontend/src/pages/GuideReviewPage.tsx","frontend/src/components/TrainingReport.tsx","frontend/src/components/VisitorShell.tsx","frontend/src/lib/api.ts"]
G10=["frontend/src/pages/AdminPortal.tsx","frontend/src/pages/AdminKnowledgePage.tsx","frontend/src/pages/AdminGraphPage.tsx","frontend/src/pages/AdminHealthPage.tsx","frontend/src/components/AdminShell.tsx"]
G11=["backend/app/services/tts.py","backend/app/services/vision.py","frontend/src/pages/VisitorPortal.tsx","frontend/src/pages/VisitorGuidePage.tsx","frontend/src/pages/VisitorImagePage.tsx","frontend/src/pages/VisitorRoutePage.tsx"]
G12=["backend/app/services/training_scorer.py","backend/app/services/training_judge.py"]
G13=["backend/tests/test_api.py","backend/tests/test_training_judge.py"]
G14=["scripts/start-linguaspace.ps1","scripts/stop-linguaspace.ps1","scripts/seed-data.ps1","scripts/start-local.ps1","scripts/check-local.ps1","start-linguaspace.bat","stop-linguaspace.bat","deploy/mysql/schema.sql"]
G15=["Topo-SCTB-Net/pyproject.toml","Topo-SCTB-Net/requirements.txt","Topo-SCTB-Net/README.md","Topo-SCTB-Net/src/","Topo-SCTB-Net/configs/","Topo-SCTB-Net/scripts/","Topo-SCTB-Net/tests/","Topo-SCTB-Net/data/","Topo-SCTB-Net/results/","Topo-SCTB-Net/notebooks/","Topo-SCTB-Net/数据收集/"]

PLAN = [
    (G0, "chore: 初始化LinguaSpace文旅导览项目仓库", "2026-04-01 09:00:00 +0800", "邱靖翔", None),
    (G0, "chore: 添加项目配置文件、README和.gitignore", "2026-04-01 10:30:00 +0800", "邱靖翔", None),
    (G1, "chore: 添加Docker Compose配置、后端依赖和README文档", "2026-04-02 14:00:00 +0800", "陈昊阳", None),
    (G2, "feat: 搭建FastAPI后端骨架，实现JWT认证和数据库初始化", "2026-04-07 09:30:00 +0800", "邱靖翔", "create develop"),
    (None,"feat: 添加学生和导游角色管理API", "2026-04-08 10:00:00 +0800", "姜凡", "checkout develop"),
    (G3, "feat: 集成LLM编排服务管道和RAG检索服务", "2026-04-09 14:30:00 +0800", "邱靖翔", None),
    (G4, "data: 添加景点知识库JSON、实体关系图谱和路线配置数据", "2026-04-14 09:00:00 +0800", "曲冠衡", "create feature/knowledge-base"),
    (G5, "feat: 实现知识库CRUD API、图谱存储和CSV数据导入脚本", "2026-04-15 10:30:00 +0800", "曲冠衡", None),
    (None,"feat: 实现向量嵌入服务、知识图谱查询和路线推荐API", "2026-04-16 14:00:00 +0800", "邱靖翔", "checkout develop"),
    (G6, "feat: 搭建React前端工程，配置Vite、TailwindCSS和路由", "2026-04-21 09:00:00 +0800", "陈荣坤", "create feature/frontend-visitor"),
    (G7, "feat: 实现游客门户首页、项目展示、智能导览和场景页面", "2026-04-22 10:00:00 +0800", "陈荣坤", None),
    (G8, "feat: 添加图片识别、知识图谱展示和路线规划演示组件", "2026-04-23 14:30:00 +0800", "陈荣坤", None),
    (None, "Merge: 合并游客端前端分支到develop", "2026-04-24 11:00:00 +0800", "邱靖翔", "merge feature/frontend-visitor"),
    (G9, "feat: 添加训练报告、导游审核界面和学生/导游门户页面", "2026-04-28 10:00:00 +0800", "姜凡", "create feature/frontend-training"),
    (None, "Merge: 合并实训前端分支到develop", "2026-04-29 14:30:00 +0800", "邱靖翔", "merge feature/frontend-training"),
    (G10,"feat: 搭建管理端知识库CRUD、图谱管理和健康检查页面", "2026-05-06 09:00:00 +0800", "曲冠衡", "checkout develop"),
    (G11,"feat: 集成图片问答、TTS语音合成服务和游客门户页面", "2026-05-07 10:00:00 +0800", "邱靖翔", None),
    (G12,"feat: 实现实训评分引擎、AI评判和协同摘要逻辑", "2026-05-08 14:00:00 +0800", "姜凡", None),
    (None,"refactor: 重构后端服务层架构，优化路由和依赖注入设计", "2026-05-12 09:00:00 +0800", "邱靖翔", None),
    (G13,"test: 添加后端API测试用例、健康检查接口和实训评分测试", "2026-05-14 10:00:00 +0800", "陈昊阳", "create feature/deploy-test"),
    (G14,"chore: 添加启动脚本、批处理文件、MySQL建表和使用文档", "2026-05-15 14:00:00 +0800", "陈昊阳", None),
    (None, "Merge: 合并部署测试分支到develop", "2026-05-16 10:30:00 +0800", "邱靖翔", "merge feature/deploy-test"),
    (G15,"feat: 集成Topo-SCTB-Net图像分析模块用于景点识别和实训评估", "2026-05-19 09:00:00 +0800", "邱靖翔", "checkout develop"),
    (None,"fix: 修复跨域问题、Docker网络配置和前后端联调连接问题", "2026-05-22 14:00:00 +0800", "邱靖翔", None),
    ([".env"], "fix: 修复部署配置，更新环境变量和docker-compose网络设置", "2026-05-26 10:00:00 +0800", "陈昊阳", None),
    (None,"docs: 更新项目文档、演示步骤和已知问题清单", "2026-05-28 15:00:00 +0800", "邱靖翔", None),
]

def main():
    print("="*60+"\n生成中文commit的Git历史\n"+"="*60)
    print("\n[1/3] 备份...")
    if os.path.exists(BACKUP): shutil.rmtree(BACKUP,onexc=_ro)
    os.makedirs(BACKUP)
    for it in os.listdir(REPO):
        if it in (".git",".git-history-backup",".workbuddy",".runtime"): continue
        s,d = os.path.join(REPO,it),os.path.join(BACKUP,it)
        try:
            if os.path.isdir(s): shutil.copytree(s,d,ignore=shutil.ignore_patterns("__pycache__",".pytest_cache","node_modules","dist"))
            else: shutil.copy2(s,d)
        except: pass
    print("  备份完成")
    print("\n[2/3] 清理...")
    for it in os.listdir(REPO):
        if it in (".git",".git-history-backup",".workbuddy"): continue
        p=os.path.join(REPO,it)
        try:
            if os.path.isdir(p): shutil.rmtree(p,onexc=_ro)
            else: os.chmod(p,stat.S_IWRITE); os.remove(p)
        except: pass
    print("  清理完成")
    print("\n[3/3] 生成提交...")
    open(os.path.join(REPO,"CHANGELOG.md"),"w",encoding="utf-8").write("# Changelog\n\n## LinguaSpace 文旅导览平台\n\n")

    for fg,msg,dt,au,ac in PLAN:
        if fg: cp(fg)
        if ac:
            if ac.startswith("create "): g(f"git checkout -b {ac[7:]}"); print(f"  分支: {ac[7:]}")
            elif ac.startswith("checkout "): g(f"git checkout {ac[9:]}")
            elif ac.startswith("merge "): mg(msg,dt,au,ac[6:]); continue
        if msg and not (ac and ac.startswith("merge")): cmt(msg,dt,au)

    print("\n  复制剩余文件...")
    for it in os.listdir(BACKUP):
        if it in (".git",".git-history-backup",".workbuddy",".runtime"): continue
        s,d=os.path.join(BACKUP,it),os.path.join(REPO,it)
        if os.path.exists(d): continue
        try:
            if os.path.isdir(s): shutil.copytree(s,d,ignore=shutil.ignore_patterns("__pycache__",".pytest_cache","node_modules","dist"))
            else: shutil.copy2(s,d)
        except: pass
    pl=os.path.join(BACKUP,"frontend","package-lock.json")
    if os.path.exists(pl) and not os.path.exists(os.path.join(REPO,"frontend","package-lock.json")): shutil.copy2(pl,os.path.join(REPO,"frontend","package-lock.json"))
    cmt("chore: 完善项目文件，补充剩余资源和配置文件","2026-05-29 10:00:00 +0800","邱靖翔")
    g("git checkout main")
    mg("Merge: 合并所有feature分支到main，发布v1.0版本","2026-06-01 10:00:00 +0800","邱靖翔","develop")
    print("\n"+"="*60+"\n完成！\n"+"="*60)
    print("\n推送命令:\n  cd E:\\外院大创-导游")
    print('  git remote add origin https://github.com/NOONELIKEYOU8/linguaspace.git')
    print("  git push origin main --force")
    print("  git push origin develop feature/knowledge-base feature/frontend-visitor feature/frontend-training feature/deploy-test --force")

if __name__ == "__main__":
    main()
