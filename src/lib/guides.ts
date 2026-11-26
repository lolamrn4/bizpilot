// Guides publics (référencement Google). Chaque guide a sa traduction (pair).
// Contenu volontairement général : pas de conseil fiscal ni comptable.

export type GuideSection = { h: string; p?: string[]; list?: string[] };
export type Guide = {
  slug: string;
  lang: "fr" | "en";
  pair: string;
  title: string;
  description: string;
  intro: string[];
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  // ------------------------------------------------------------------ FR 1
  {
    slug: "gerer-ventes-stock-sans-excel",
    lang: "fr",
    pair: "track-sales-inventory-without-spreadsheet",
    title: "Comment suivre ses ventes et son stock sans Excel (petit commerce, auto-entrepreneur)",
    description:
      "Cahier, tableur, mémoire… Voici une méthode simple pour suivre vos ventes et votre stock au quotidien, sans connaissances en comptabilité.",
    intro: [
      "Quand on tient une petite boutique ou qu'on vend en ligne, on commence souvent avec un cahier ou un tableur. Ça marche… jusqu'au jour où on ne sait plus combien il reste d'un produit, ni combien on a vraiment vendu ce mois-ci.",
      "Bonne nouvelle : suivre ses ventes et son stock ne demande ni logiciel compliqué ni formation en comptabilité. Il suffit de quelques habitudes simples.",
    ],
    sections: [
      {
        h: "Pourquoi le cahier et le tableur finissent par coincer",
        list: [
          "Il faut tout recopier deux fois : la vente, puis la sortie de stock.",
          "Les totaux se calculent à la main, avec des erreurs.",
          "On ne voit pas venir les ruptures : on s'en rend compte quand un client demande le produit.",
          "Impossible de savoir rapidement quel produit rapporte le plus.",
        ],
      },
      {
        h: "La méthode simple en 4 habitudes",
        list: [
          "Notez chaque vente au moment où elle a lieu, avec le produit, la quantité et le prix.",
          "Faites baisser le stock automatiquement à chaque vente, au lieu de le recompter.",
          "Fixez un seuil d'alerte par produit (par exemple 5 pièces) pour commander à temps.",
          "Une fois par semaine, regardez vos 3 meilleures ventes et vos produits qui dorment.",
        ],
      },
      {
        h: "Ce qu'un bon outil doit faire à votre place",
        p: [
          "L'objectif n'est pas de devenir comptable, mais de ne plus perdre de temps ni d'argent. Un outil adapté aux petits commerces doit calculer les totaux tout seul, mettre le stock à jour à chaque vente et vous prévenir avant qu'un produit soit épuisé.",
          "C'est exactement ce que fait Biz Pilot Digital : vous choisissez le produit et la quantité, le total se calcule, le stock baisse automatiquement et une alerte apparaît quand un article passe sous son seuil. Tout fonctionne sur votre téléphone, en euros, en dollars ou dans votre devise.",
        ],
      },
      {
        h: "Et après ?",
        p: [
          "Une fois vos ventes et votre stock à jour, vous pouvez aller plus loin : suivre vos dépenses, connaître votre bénéfice du mois et vérifier que vos prix couvrent bien vos coûts. Ce sont les sujets de nos autres guides.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ FR 2
  {
    slug: "calculer-marge-prix-de-vente",
    lang: "fr",
    pair: "calculate-profit-margin-set-prices",
    title: "Calculer sa marge et fixer le bon prix de vente : la méthode simple",
    description:
      "Coût de revient, marge, taux de marque : comprenez en 5 minutes si vos prix couvrent vraiment vos coûts, avec un exemple chiffré.",
    intro: [
      "Beaucoup de commerçants fixent leurs prix « au feeling » ou en copiant la concurrence. Résultat : certains produits se vendent bien… mais ne rapportent presque rien.",
      "Voici comment vérifier vos prix en trois calculs simples.",
    ],
    sections: [
      {
        h: "1. Calculez le vrai coût d'un produit",
        p: [
          "Le coût d'un produit, ce n'est pas seulement son prix d'achat. Ajoutez le transport, l'emballage et tout ce que vous payez pour le mettre en vente.",
          "Exemple : une veste achetée 20 € + 2 € de transport = un coût de 22 €.",
        ],
      },
      {
        h: "2. Calculez votre marge",
        p: [
          "Marge = prix de vente − coût. Si vous vendez la veste 40 €, votre marge est de 40 − 22 = 18 €.",
          "Exprimée en pourcentage du prix de vente : 18 ÷ 40 = 45 %. Autrement dit, sur chaque euro encaissé, 45 centimes restent pour payer vos frais (loyer, publicité…) et votre bénéfice.",
        ],
      },
      {
        h: "3. Trouvez le prix minimum pour une marge visée",
        p: [
          "Si vous voulez garder au moins 30 % du prix de vente, la formule est : prix = coût ÷ (1 − 0,30).",
          "Pour la veste : 22 ÷ 0,70 = 31,43 €. En dessous de ce prix, vous gagnez moins de 30 % ; à 40 €, vous êtes confortable.",
        ],
      },
      {
        h: "Les erreurs les plus courantes",
        list: [
          "Oublier le transport et l'emballage dans le coût.",
          "Confondre marge sur le prix de vente et majoration sur le coût (18 € de marge = 45 % du prix, mais 82 % du coût).",
          "Ne jamais revoir ses prix quand le fournisseur augmente les siens.",
          "Faire des promotions sans vérifier qu'il reste une marge.",
        ],
      },
      {
        h: "Laissez l'outil faire le calcul",
        p: [
          "Dans Biz Pilot Digital, l'outil Smart Pricing reprend le coût d'achat et le transport de chaque produit, calcule votre marge réelle à partir de vos ventes et vous suggère un prix. Il vous signale aussi les produits vendus à perte ou avec une marge trop faible.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ FR 3
  {
    slug: "suivre-credits-clients",
    lang: "fr",
    pair: "track-customers-who-owe-you",
    title: "Crédits clients : comment ne plus oublier qui vous doit de l'argent",
    description:
      "Ventes à crédit, paiements en plusieurs fois, ardoises… Une méthode simple pour suivre ce que vos clients vous doivent et relancer sans gêne.",
    intro: [
      "Faire crédit à un bon client, c'est souvent normal. Mais quand les ardoises s'accumulent dans un cahier ou dans votre tête, l'argent finit par se perdre.",
      "Voici comment garder le contrôle, sans abîmer la relation avec vos clients.",
    ],
    sections: [
      {
        h: "Notez chaque crédit tout de suite",
        p: [
          "Pour chaque vente non payée (ou payée en partie), notez le client, la date, le montant total et ce qui a déjà été versé. Le reste dû doit se calculer automatiquement.",
        ],
      },
      {
        h: "Regardez le total chaque semaine",
        p: [
          "Le chiffre à surveiller : le total que vos clients vous doivent. S'il grossit de semaine en semaine, c'est autant d'argent qui manque dans votre caisse pour racheter du stock.",
        ],
      },
      {
        h: "Relancez avec un message clair et poli",
        list: [
          "Rappelez le montant exact et la date de l'achat.",
          "Joignez le reçu : le client voit ce qu'il a acheté, il n'y a pas de discussion.",
          "Restez simple et cordial : « Bonjour, petit rappel : il reste 190 € sur vos achats du 17 novembre. Merci ! »",
          "Relancez à date fixe (par exemple tous les 7 jours) plutôt qu'au hasard.",
        ],
      },
      {
        h: "Fixez vos règles",
        p: [
          "Décidez à l'avance jusqu'à quel montant vous faites crédit, et à qui. Un client qui doit déjà beaucoup ne reprend pas de marchandise à crédit tant qu'il n'a pas réglé une partie.",
        ],
      },
      {
        h: "Avec Biz Pilot Digital",
        p: [
          "Le carnet clients affiche le total dû par vos clients, le reste à payer de chacun et l'ancienneté de la dette. En un clic, un message de rappel est préparé, avec les liens vers les reçus, et s'ouvre dans WhatsApp pour que vous n'ayez plus qu'à l'envoyer.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ FR 4
  {
    slug: "calculer-benefice-boutique",
    lang: "fr",
    pair: "how-much-profit-small-shop",
    title: "Combien je gagne vraiment ? Estimer le bénéfice de sa boutique chaque mois",
    description:
      "Chiffre d'affaires, dépenses, bénéfice : la méthode simple pour savoir chaque mois si votre commerce gagne de l'argent.",
    intro: [
      "« Je vends tous les jours, mais à la fin du mois je ne sais pas combien il me reste. » C'est la phrase qu'on entend le plus chez les petits commerçants.",
      "Le problème n'est pas le manque de ventes : c'est qu'on regarde l'argent qui rentre, sans le comparer à l'argent qui sort.",
    ],
    sections: [
      {
        h: "Les trois chiffres à connaître",
        list: [
          "Le chiffre d'affaires : le total de vos ventes sur le mois.",
          "Les dépenses : tout ce que vous avez payé pour faire tourner le commerce (marchandises, loyer, transport, publicité, internet, salaires…).",
          "Le résultat : chiffre d'affaires − dépenses. C'est ce qui reste réellement.",
        ],
      },
      {
        h: "Un exemple concret",
        p: [
          "Ce mois-ci, une boutique a vendu pour 3 000 €. Elle a dépensé 1 400 € en marchandises, 600 € de loyer, 150 € de publicité et 150 € de transport et d'internet, soit 2 300 € au total.",
          "Résultat estimé : 3 000 − 2 300 = 700 €. Sans ce calcul, la commerçante aurait pu croire qu'elle avait « gagné 3 000 € ».",
        ],
      },
      {
        h: "Encaissé ou vendu ?",
        p: [
          "Si vous faites crédit, une partie de vos ventes n'est pas encore dans votre caisse. Suivez donc aussi l'argent réellement encaissé et ce que vos clients vous doivent : un mois rentable sur le papier peut quand même laisser la caisse vide.",
        ],
      },
      {
        h: "Une habitude de 10 minutes par mois",
        list: [
          "Notez chaque dépense dès qu'elle a lieu, avec sa catégorie.",
          "En fin de mois, comparez ventes et dépenses.",
          "Repérez la dépense qui a le plus augmenté et demandez-vous si elle a rapporté des ventes.",
        ],
      },
      {
        h: "Avec Biz Pilot Digital",
        p: [
          "Le tableau de bord affiche automatiquement votre chiffre d'affaires, l'argent encaissé, vos dépenses, votre résultat estimé et les paiements en attente, pour le jour, la semaine, le mois ou l'année. Vous pouvez exporter vos rapports en PDF ou en CSV.",
          "Ces chiffres sont une estimation basée sur ce que vous enregistrez ; ils ne remplacent pas une comptabilité officielle ni l'avis d'un comptable.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ EN 1
  {
    slug: "track-sales-inventory-without-spreadsheet",
    lang: "en",
    pair: "gerer-ventes-stock-sans-excel",
    title: "How to Track Sales and Inventory Without a Spreadsheet (for Small Shops)",
    description:
      "Notebook, spreadsheet, memory… Here is a simple way for small shops and side hustles to track sales and stock every day, no accounting skills needed.",
    intro: [
      "Most small shops and online sellers start with a notebook or a spreadsheet. It works fine — until you no longer know how many units are left, or how much you actually sold this month.",
      "The good news: tracking sales and inventory doesn't require heavy software or bookkeeping training. A few simple habits are enough.",
    ],
    sections: [
      {
        h: "Why notebooks and spreadsheets stop working",
        list: [
          "You write everything twice: once for the sale, once for the stock.",
          "Totals are added up by hand, with mistakes.",
          "You don't see stock-outs coming — you find out when a customer asks.",
          "You can't quickly tell which product makes you the most money.",
        ],
      },
      {
        h: "The simple method: 4 habits",
        list: [
          "Record each sale when it happens: product, quantity, price.",
          "Let stock go down automatically with every sale instead of recounting.",
          "Set a low-stock alert for each product (for example 5 units) so you reorder in time.",
          "Once a week, check your top 3 sellers and the products that don't move.",
        ],
      },
      {
        h: "What a good tool should do for you",
        p: [
          "The goal isn't to become an accountant — it's to stop losing time and money. A tool built for small shops should add up totals on its own, update stock with every sale, and warn you before something runs out.",
          "That's exactly what Biz Pilot Digital does: pick the product and quantity, the total is calculated, stock goes down automatically, and an alert appears when an item drops below its threshold. It all works on your phone, in dollars, euros, pounds or your own currency.",
        ],
      },
      {
        h: "What's next?",
        p: [
          "Once sales and stock are under control, you can go further: track expenses, know your real profit each month, and check that your prices cover your costs. Our other guides cover those topics.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ EN 2
  {
    slug: "calculate-profit-margin-set-prices",
    lang: "en",
    pair: "calculer-marge-prix-de-vente",
    title: "How to Calculate Profit Margin and Price Your Products (Simple Method)",
    description:
      "Product cost, margin, markup: find out in 5 minutes whether your prices really cover your costs, with a worked example.",
    intro: [
      "Many small sellers set prices by gut feeling or by copying competitors. The result: some products sell well… but barely make any money.",
      "Here's how to check your prices with three simple calculations.",
    ],
    sections: [
      {
        h: "1. Work out the true cost of a product",
        p: [
          "A product's cost isn't just what you paid for it. Add shipping, packaging and anything else you pay to get it ready to sell.",
          "Example: a jacket bought for $20 + $2 shipping = a cost of $22.",
        ],
      },
      {
        h: "2. Calculate your margin",
        p: [
          "Margin = selling price − cost. If you sell the jacket for $40, your margin is 40 − 22 = $18.",
          "As a percentage of the selling price: 18 ÷ 40 = 45%. In other words, out of every dollar you take in, 45 cents are left to pay your overheads (rent, ads…) and your profit.",
        ],
      },
      {
        h: "3. Find the minimum price for a target margin",
        p: [
          "If you want to keep at least 30% of the selling price, the formula is: price = cost ÷ (1 − 0.30).",
          "For the jacket: 22 ÷ 0.70 = $31.43. Below that price you keep less than 30%; at $40 you're comfortable.",
        ],
      },
      {
        h: "Common mistakes",
        list: [
          "Leaving shipping and packaging out of the cost.",
          "Mixing up margin and markup ($18 is a 45% margin on price, but an 82% markup on cost).",
          "Never updating prices when your supplier raises theirs.",
          "Running discounts without checking there's still a margin left.",
        ],
      },
      {
        h: "Let the tool do the math",
        p: [
          "In Biz Pilot Digital, Smart Pricing takes each product's purchase and shipping cost, works out your real margin from your sales, and suggests a price. It also flags products sold at a loss or with a margin that's too thin.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ EN 3
  {
    slug: "track-customers-who-owe-you",
    lang: "en",
    pair: "suivre-credits-clients",
    title: "How to Keep Track of Customers Who Owe You Money",
    description:
      "Store credit, layaway, unpaid invoices… A simple way for small businesses to track what customers owe and follow up politely.",
    intro: [
      "Letting a good customer pay later is often part of running a small business. But when IOUs pile up in a notebook or in your head, money gets lost.",
      "Here's how to stay in control without hurting the relationship with your customers.",
    ],
    sections: [
      {
        h: "Record every balance right away",
        p: [
          "For each unpaid or partly paid sale, note the customer, the date, the total and what has already been paid. The balance due should be calculated automatically.",
        ],
      },
      {
        h: "Check the total every week",
        p: [
          "The number to watch: the total your customers owe you. If it grows week after week, that's cash missing from your till when you need to restock.",
        ],
      },
      {
        h: "Follow up with a clear, friendly message",
        list: [
          "State the exact amount and the purchase date.",
          "Attach the receipt so the customer sees what they bought — no back and forth.",
          "Keep it short and polite: \"Hi! Quick reminder: there's $190 left on your purchase from November 17. Thank you!\"",
          "Follow up on a fixed schedule (for example every 7 days) rather than at random.",
        ],
      },
      {
        h: "Set your own rules",
        p: [
          "Decide in advance how much credit you allow, and to whom. A customer who already owes a lot doesn't take more goods on credit until part of the balance is paid.",
        ],
      },
      {
        h: "With Biz Pilot Digital",
        p: [
          "The customer book shows the total owed by your customers, each customer's balance and how old the debt is. In one tap, a reminder message is drafted with links to the receipts and opens in WhatsApp, ready to send.",
        ],
      },
    ],
  },
  // ------------------------------------------------------------------ EN 4
  {
    slug: "how-much-profit-small-shop",
    lang: "en",
    pair: "calculer-benefice-boutique",
    title: "How Much Profit Is Your Small Shop Really Making? A Simple Monthly Check",
    description:
      "Revenue, expenses, profit: the simple way to know every month whether your small business is actually making money.",
    intro: [
      "\"I sell every day, but at the end of the month I don't know what's left.\" It's one of the most common things small business owners say.",
      "The issue usually isn't a lack of sales: it's looking at the money coming in without comparing it to the money going out.",
    ],
    sections: [
      {
        h: "The three numbers you need",
        list: [
          "Revenue: the total of your sales for the month.",
          "Expenses: everything you paid to keep the business running (stock, rent, shipping, ads, internet, wages…).",
          "Result: revenue − expenses. That's what's really left.",
        ],
      },
      {
        h: "A real-life example",
        p: [
          "This month, a shop sold $3,000 worth of goods. It spent $1,400 on stock, $600 on rent, $150 on ads and $150 on shipping and internet — $2,300 in total.",
          "Estimated result: 3,000 − 2,300 = $700. Without this check, the owner might have thought she \"made $3,000\".",
        ],
      },
      {
        h: "Sold or actually collected?",
        p: [
          "If you let customers pay later, part of your sales isn't in your till yet. Track the cash actually collected and what customers still owe you: a month that's profitable on paper can still leave you short of cash.",
        ],
      },
      {
        h: "A 10-minute monthly habit",
        list: [
          "Record each expense when it happens, with a category.",
          "At the end of the month, compare sales and expenses.",
          "Spot the expense that grew the most and ask whether it brought in more sales.",
        ],
      },
      {
        h: "With Biz Pilot Digital",
        p: [
          "The dashboard automatically shows your revenue, cash collected, expenses, estimated result and pending payments — for today, this week, this month or the year. You can export reports as PDF or CSV.",
          "These figures are an estimate based on what you record; they don't replace official bookkeeping or advice from an accountant.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
