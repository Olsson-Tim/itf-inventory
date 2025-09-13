# Enhetsinventarie System

Ett enkelt och effektivt system för hantering av enhetsinventarier byggt med Node.js, Express och SQLite. Detta system gör det möjligt att spåra och hantera din organisations enheter med ett intuitivt webbgränssnitt.

## Funktioner

- **Enhets hantering**: Lägg till, redigera, visa och ta bort enheter
- **Massimport/Export**: Importera enheter från CSV-filer och exportera hela inventariet
- **Sökfunktion**: Hitta snabbt enheter efter namn, typ, serienummer eller andra attribut
- **Enhetsstatus spårning**: Spåra enhetens tillgänglighet med statusar (Tillgänglig, Används, Underhåll)
- **Responsiv design**: Fungerar på stationära och mobila enheter
- **Mörkt läge**: Ögonvänligt mörkt tema
- **Docker support**: Enkel distribution med Docker och Docker Compose

## Kom igång

### Förutsättningar

- Node.js (version 16 eller högre)
- npm (följer med Node.js)

### Installation

1. Klona repositoryt:
   ```bash
   git clone <repository-url>
   cd inventory-system
   ```

2. Installera beroenden:
   ```bash
   npm install
   ```

3. Starta applikationen:
   ```bash
   npm start
   ```

4. Öppna webbläsaren och navigera till `http://localhost:3000`

### Använda Docker

1. Bygg och kör med Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. Kom åt applikationen på `http://localhost:3000`

## Användning

### Lägga till enheter

1. Fyll i enhetsinformationen i formuläret "Lägg till ny enhet"
2. Klicka på "Lägg till enhet" för att spara enheten i inventariet

### Redigera enheter

1. Klicka på knappen "Redigera enhet" på valfritt enhetskort
2. Ändra enhetsinformationen i modalen
3. Klicka på "Uppdatera enhet" för att spara ändringarna

### Ta bort enheter

1. Klicka på knappen "Ta bort enhet" på valfritt enhetskort
2. Bekräfta borttagningen i dialogrutan

### Massimport

1. Klicka på knappen "Importera enheter"
2. Välj en CSV-fil med enhetsinformation
3. Systemet kommer att importera alla giltiga enheter från filen

### Massexport

1. Klicka på knappen "Exportera enheter"
2. Systemet kommer att ladda ner en CSV-fil med alla enheter

### Sökning

1. Skriv i sökrutan för att filtrera enheter efter attribut
2. Listan uppdateras automatiskt när du skriver

### Mörkt läge

1. Klicka på måne/sol-ikonen uppe i högra hörnet
2. Växla mellan ljust och mörkt tema

## CSV-format

När du importerar enheter, använd följande CSV-format:

```csv
name,type,serial_number,manufacturer,model,status,location,assigned_to,notes
"Enhetsnamn",Computer,SN123456,Tillverkare,Modellnamn,Available,Plats,Tilldelad Person,Ytterligare anteckningar
```

Obligatoriska fält:
- `name`
- `type` 
- `status`

Se `example_devices.csv` för ett komplett exempel.

## API-slutpunkter

- `GET /api/devices` - Hämta alla enheter
- `GET /api/devices/:id` - Hämta en specifik enhet
- `POST /api/devices` - Skapa en ny enhet
- `PUT /api/devices/:id` - Uppdatera en enhet
- `DELETE /api/devices/:id` - Ta bort en enhet
- `GET /api/devices/export` - Exportera enheter som CSV
- `POST /api/devices/import` - Importera enheter från CSV
- `GET /api/stats` - Hämta inventariestatistik
- `GET /api/health` - Hälsokontroll

## Utveckling

### Köra i utvecklingsläge

```bash
npm run dev
```

Detta startar servern med nodemon för automatiska omstarter vid kodändringar.

### Projektsstruktur

```
inventory-system/
├── server.js          # Huvudserverfil
├── package.json       # Projektsberoenden
├── Dockerfile         # Docker-konfiguration
├── docker-compose.yml # Docker Compose-konfiguration
├── .dockerignore      # Docker ignoreringsmönster
├── example_devices.csv # Exempel CSV för import
├── public/            # Frontend-filer
│   └── index.html     # Huvud HTML-fil
└── data/              # SQLite-databas (skapas automatiskt)
```

## Bidra

1. Forka repositoryt
2. Skapa en feature branch
3. Commita dina ändringar
4. Pusha till branchen
5. Skapa en pull request

## Licens

Detta projekt är licensierat under MIT License - se LICENSE-filen för detaljer.

## Support

För support, vänligen öppna ett issue på GitHub-repositoryt.