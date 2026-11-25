"""Test de bout en bout de la phase 1 (navigateur réel, Supabase local).
Usage : python3 tests/e2e_phase1.py  (serveur Next sur :3000, stack Supabase sur :54321)
"""
import glob, os, re, subprocess, sys, time, quopri
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
SHOTS = "/home/claude/shots"
os.makedirs(SHOTS, exist_ok=True)
MAILDIR = "/tmp/mail"
results = []

def ok(label):
    results.append(label); print("OK ", label, flush=True)

def sql(q):
    return subprocess.check_output(["psql", "-h", "127.0.0.1", "-p", "54322", "-U", "postgres", "-tAc", q], text=True).strip()

def last_link(email, kind):
    for _ in range(40):
        files = sorted(glob.glob(f"{MAILDIR}/*_{email}.eml"))
        for f in reversed(files):
            body = quopri.decodestring(open(f, "rb").read()).decode("utf-8", "ignore")
            if kind in body:
                m = re.search(r'href="([^"]+/auth/v1/verify[^"]+)"', body)
                if m:
                    os.remove(f)
                    return m.group(1).replace("&amp;", "&")
        time.sleep(0.25)
    raise AssertionError(f"pas d'e-mail {kind} pour {email}")

def shot(page, name):
    page.screenshot(path=f"{SHOTS}/{name}.png", full_page=True)

run = str(int(time.time()))
EMAIL = f"amina{run}@test.local"
EMAIL2 = f"karim{run}@test.local"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="fr-FR", accept_downloads=True)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # 1. Accueil
    page.goto(BASE + "/")
    expect(page.get_by_role("heading", level=1)).to_contain_text("copilote")
    shot(page, "01_accueil_mobile"); ok("page d'accueil en français")

    # 2. Inscription
    page.goto(BASE + "/signup")
    page.fill("input[name=full_name]", "Amina Diallo")
    page.fill("input[name=email]", EMAIL)
    page.fill("input[name=password]", "MotDePasse!2026")
    page.check("input[name=terms]")
    shot(page, "02_inscription")
    page.click("button[type=submit]")
    page.wait_for_url("**/check-email**")
    expect(page.get_by_text(EMAIL)).to_be_visible(); ok("inscription => page « vérifiez votre e-mail »")

    # Connexion refusée avant confirmation
    page.goto(BASE + "/login")
    page.fill("input[name=email]", EMAIL); page.fill("input[name=password]", "MotDePasse!2026")
    page.click("button[type=submit]")
    expect(page.locator("p[role=alert]")).to_contain_text("pas encore confirmé"); ok("connexion bloquée tant que l'e-mail n'est pas confirmé")

    # 3. Confirmation par le lien reçu
    page.goto(last_link(EMAIL, "signup") if False else last_link(EMAIL, "verify"))
    page.wait_for_url("**/onboarding")
    ok("lien de confirmation e-mail => session ouverte, création d'entreprise")

    # 4. Création d'entreprise (devise XOF)
    page.fill("input[name=name]", "Boutique Amina")
    expect(page.locator("input[name=owner_name]")).to_have_value("Amina Diallo")
    page.fill("input[name=sector]", "Cosmétiques"); page.fill("input[name=city]", "Dakar")
    page.select_option("select[name=currency]", "XOF")
    page.select_option("select[name=timezone]", "Africa/Dakar")
    shot(page, "03_creation_entreprise")
    page.click("button[type=submit]")
    page.wait_for_url(BASE + "/app")
    expect(page.get_by_text("Bonjour Amina")).to_be_visible()
    shot(page, "04_tableau_de_bord_vide"); ok("entreprise créée, tableau de bord affiché")

    # 5. Produit : coûts + stock initial 10
    page.goto(BASE + "/app/products/new")
    page.fill("input[name=name]", "Crème karité 250 ml")
    page.fill("input[name=category]", "Soins")
    page.fill("input[name=purchase_price]", "2000")
    page.fill("input[name=transport_cost]", "300")
    page.fill("input[name=packaging_cost]", "200")
    page.fill("input[name=sale_price]", "2400")
    expect(page.get_by_text("vous vendez à perte")).to_be_visible(); ok("alerte « vente à perte » en direct")
    page.fill("input[name=sale_price]", "3500")
    expect(page.get_by_text("vous vendez à perte")).to_have_count(0)
    expect(page.locator("dd").nth(2)).to_contain_text("28,6")   # marge 1000/3500
    expect(page.locator("dd").nth(3)).to_contain_text("40")     # majoration 1000/2500
    ok("marge (28,6 %) et majoration (40 %) calculées séparément")
    page.fill("input[name=stock_quantity]", "10"); page.fill("input[name=low_stock_threshold]", "4")
    shot(page, "05_nouveau_produit")
    page.click("button[type=submit]")
    page.wait_for_url(re.compile(r".*/app/products/[0-9a-f-]{36}$"))
    expect(page.locator("main")).to_contain_text("10"); ok("produit créé avec stock initial 10")
    product_url = page.url

    # 6. Ventes
    page.goto(BASE + "/app/sales/new")
    page.fill("input[name=quantity]", "3")
    expect(page.locator("form")).to_contain_text("10 500")
    page.fill("input[name=customer_name]", "Fatou")
    shot(page, "06_nouvelle_vente")
    page.click("button[type=submit]")
    page.wait_for_url("**/app/sales?created=1"); ok("vente payée enregistrée")
    page.goto(BASE + "/app/sales/new")
    page.fill("input[name=quantity]", "2"); page.select_option("select[name=status]", "pending")
    expect(page.locator("option[value=partial]")).to_have_attribute("disabled", ""); ok("Free : option « partiellement payé » verrouillée")
    page.fill("input[name=customer_name]", "Moussa")
    page.click("button[type=submit]"); page.wait_for_url("**/app/sales?created=1")
    page.goto(BASE + "/app/sales/new")
    page.fill("input[name=quantity]", "50"); page.click("button[type=submit]")
    expect(page.locator("p[role=alert]")).to_contain_text("Stock insuffisant"); ok("vente au-delà du stock refusée avec message clair")
    page.goto(product_url)
    expect(page.locator("main p").first).to_contain_text("5"); ok("stock mis à jour automatiquement (10 − 3 − 2 = 5)")
    shot(page, "07_fiche_produit")

    # 7. Encaisser la vente en attente
    page.goto(BASE + "/app/sales")
    shot(page, "08_liste_ventes")
    page.get_by_text("Moussa").click()
    page.wait_for_url(re.compile(r".*/app/sales/[0-9a-f-]{36}$"))
    expect(page.locator("input[name=amount]")).to_have_value("7000")
    page.click("text=Ajouter un paiement")
    expect(page.get_by_text("entièrement payée")).to_be_visible(); ok("paiement du solde => vente payée")

    # 8. Dépense avec catégorie personnalisée
    page.goto(BASE + "/app/expenses/new")
    page.fill("input[name=name]", "Loyer novembre")
    page.select_option("select[name=category_id]", "__new")
    page.fill("input[name=new_category]", "Loyer boutique")
    page.fill("input[name=amount]", "5000")
    expect(page.get_by_text("Justificatifs : formule Standard")).to_be_visible()
    shot(page, "09_nouvelle_depense")
    page.click("button[type=submit]"); page.wait_for_url("**/app/expenses?created=1")
    ok("dépense + catégorie personnalisée enregistrées")

    # 9. Tableau de bord
    page.goto(BASE + "/app")
    main = page.locator("main")
    expect(main).to_contain_text("17 500")   # CA 5 × 3 500
    expect(main).to_contain_text("12 500")   # résultat 17 500 − 5 000
    expect(main).to_contain_text("12 500")   # valeur du stock 5 × 2 500
    shot(page, "10_tableau_de_bord"); ok("tableau de bord : CA 17 500, dépenses 5 000, résultat 12 500, stock 12 500 F CFA")
    expect(page.get_by_role("button", name="Année")).to_be_disabled(); ok("Free : filtres hors mois en cours verrouillés")

    # 10. Rapports & exports (Free => refus serveur)
    page.goto(BASE + "/app/reports")
    expect(page.get_by_text("Exports PDF/CSV : formule Standard")).to_be_visible()
    r = page.request.get(BASE + "/api/export?section=sales&format=csv")
    assert r.status == 403, r.status
    ok("Free : export refusé côté serveur (HTTP 403)")
    r = page.request.get(BASE + "/api/backup")
    assert r.status == 200 and '"bizpilot-backup"' in r.text()
    ok("sauvegarde JSON téléchargeable")

    # 11. Passage en Standard (écriture serveur, comme le futur webhook) => fonctions débloquées
    uid = sql(f"select id from auth.users where email='{EMAIL}'")
    sql(f"update public.subscriptions set plan_code='standard' where user_id='{uid}'")
    page.goto(BASE + "/app/reports")
    with page.expect_download() as dl:
        page.locator("a[href*='section=sales'][href*='format=csv']").click()
    csv = open(dl.value.path(), encoding="utf-8-sig").read()
    assert "Crème karité" in csv and "Fatou" in csv, csv
    ok("Standard : export CSV des ventes")
    with page.expect_download() as dl:
        page.locator("a[href*='section=summary'][href*='format=pdf']").click()
    pdf_path = f"{SHOTS}/rapport_synthese.pdf"; dl.value.save_as(pdf_path)
    assert open(pdf_path, "rb").read(4) == b"%PDF"
    ok("Standard : export PDF de la synthèse")
    shot(page, "11_rapports")

    page.goto(BASE + "/app/sales/new")
    page.fill("input[name=quantity]", "1"); page.select_option("select[name=status]", "partial")
    page.fill("input[name=amount_paid]", "1000"); page.click("button[type=submit]"); page.wait_for_url("**/app/sales?created=1")
    expect(page.locator("span.badge", has_text="Partiellement payé").first).to_be_visible(); ok("Standard : vente partiellement payée")

    # Justificatif (upload réel dans le stockage)
    page.goto(BASE + "/app/expenses/new")
    page.fill("input[name=name]", "Facture électricité")
    page.select_option("select[name=category_id]", label="Électricité")
    page.fill("input[name=amount]", "3000")
    page.set_input_files("input[type=file]", files=[{"name": "facture.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4 test"}])
    expect(page.locator("input[name=receipt_path]")).to_have_value(re.compile(r".+\.pdf$"))
    page.click("button[type=submit]"); page.wait_for_url("**/app/expenses?created=1")
    page.get_by_text("Facture électricité").click()
    href = page.get_by_text("Voir le justificatif").get_attribute("href")
    assert page.request.get(href).body().startswith(b"%PDF"); ok("Standard : justificatif envoyé et consultable (lien signé)")

    # 12. Langue anglaise
    page.goto(BASE + "/app/settings")
    page.select_option("select[name=language]", "en")
    page.get_by_role("button", name="Enregistrer").first.click()
    expect(page.locator("p[role=status]").first).to_be_visible()
    page.goto(BASE + "/app")
    expect(page.get_by_text("Hello Amina")).to_be_visible()
    expect(page.locator("main")).not_to_contain_text("Chiffre d'affaires")
    shot(page, "12_dashboard_english"); ok("interface entièrement en anglais après changement de langue")
    page.get_by_role("button", name="fr").click()
    expect(page.get_by_text("Bonjour Amina")).to_be_visible(); ok("retour au français via le sélecteur FR/EN")

    # 13. Mot de passe oublié
    page.goto(BASE + "/app/more"); page.get_by_role("button", name=re.compile("déconnecter", re.I)).click()
    page.wait_for_url("**/login")
    page.goto(BASE + "/forgot-password")
    page.fill("input[name=email]", EMAIL); page.click("button[type=submit]")
    expect(page.locator("p[role=status]")).to_be_visible()
    page.goto(last_link(EMAIL, "recovery"))
    page.wait_for_url("**/reset-password")
    page.fill("input[name=password]", "NouveauPass#2026"); page.fill("input[name=confirm]", "NouveauPass#2026")
    page.click("button[type=submit]")
    expect(page.locator("p[role=status]")).to_contain_text("modifié")
    page.goto(BASE + "/app/more"); page.get_by_role("button", name=re.compile("déconnecter", re.I)).click()
    page.fill("input[name=email]", EMAIL); page.fill("input[name=password]", "NouveauPass#2026"); page.click("button[type=submit]")
    page.wait_for_url(BASE + "/app"); ok("mot de passe oublié : lien e-mail, nouveau mot de passe, reconnexion")
    sale_id = sql(f"select s.id from sales s join businesses b on b.id=s.business_id where b.owner_id='{uid}' limit 1")

    # 14. Isolation : un autre compte ne voit rien
    ctx2 = browser.new_context(viewport={"width": 1280, "height": 860}, locale="fr-FR")
    p2 = ctx2.new_page()
    p2.goto(BASE + "/signup")
    p2.fill("input[name=full_name]", "Karim"); p2.fill("input[name=email]", EMAIL2); p2.fill("input[name=password]", "Karim!2026pass"); p2.check("input[name=terms]")
    p2.click("button[type=submit]"); p2.wait_for_url("**/check-email**")
    p2.goto(last_link(EMAIL2, "verify")); p2.wait_for_url("**/onboarding")
    p2.fill("input[name=name]", "Karim Market"); p2.select_option("select[name=currency]", "EUR"); p2.select_option("select[name=timezone]", "Europe/Paris")
    p2.click("button[type=submit]"); p2.wait_for_url(BASE + "/app")
    shot(p2, "13_dashboard_desktop_karim")
    resp = p2.goto(BASE + f"/app/sales/{sale_id}")
    assert resp.status == 404, resp.status
    p2.goto(BASE + "/app/sales"); expect(p2.locator("main")).not_to_contain_text("Fatou")
    ok("isolation : Karim ne peut ni voir ni ouvrir les ventes d'Amina (404)")

    # Vue bureau d'Amina pour la revue visuelle
    ctx3 = browser.new_context(viewport={"width": 1366, "height": 900}, locale="fr-FR", storage_state=ctx.storage_state())
    p3 = ctx3.new_page(); p3.goto(BASE + "/app?period=month"); p3.wait_for_timeout(600); shot(p3, "14_dashboard_desktop")

    assert not errors, errors
    ok("aucune erreur JavaScript dans le navigateur")
    browser.close()

print(f"\n=== {len(results)} TESTS DE BOUT EN BOUT PASSÉS ===")
