import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

MAKE_CORRECTIONS = {
    "ECEHEREYESELEEERE": "CHRYSLER",
    "ECEIETEREOEENE": "CITROËN",
    "ECEIETEREOEENE": "CITROËN",
    "EFEIEAETE": "FIAT",
    "EFEOEREDE": "FORD",
    "EGEEENEEEREAELE EMEOETEOERESE": "CHEVROLET",
    "EIEVEEECEOE": "IVECO",
    "EMEEERECEEEDEEESE-EBEEENEZE": "MERCEDES-BENZ",
    "E.E.E.E E-E E.E.E.E": "FIAT",
    "FIAI": "FIAT",
    "FORO": "FORD",
    "MITSIBISHI": "MITSUBISHI",
    "REUULT": "RENAULT"
}

# Known Norflex codes mapped from index
KNOWN_NORFLEX_MODELS = {
    "2001": ("FIAT", "147 / Panorama / Oggi / City / Fiorino", "01/76 - 12/88", "DIANTEIRO", 304, ["5966930-1"]),
    "2002": ("FIAT", "147 / Panorama / Fiorino", "01/76 - 12/88", "TRASEIRO", 257, ["5930453-1"]),
    "2003": ("FIAT", "Elba / Fiorino / Uno", "01/84 - 12/92", "DIANTEIRO", 380, ["5954603-1"]),
    "2004": ("FIAT", "Fiorino", "01/85 - 12/92", "TRASEIRO", 275, ["7573858"]),
    "2005": ("FIAT", "Tempra / Tipo", "01/92 - 12/98", "TRASEIRO", 430, ["706859"]),
    "2006": ("FIAT", "Tempra", "01/92 - 12/98", "DIANTEIRO", 445, ["1130632"]),
    "2007": ("FIAT", "Palio / Siena / Strada", "01/96 - ...", "TRASEIRO", 220, ["46456877"]),
    "2008": ("FIAT", "Palio / Siena / Strada", "01/96 - ...", "DIANTEIRO", 465, ["46448474-1"]),
    "2013": ("FIAT", "Tipo", "01/93 - 12/97", "DIANTEIRO", 410, ["8208102"]),
    "2014": ("FIAT", "Uno SX / Mille", "01/90 - ...", "DIANTEIRO", 400, ["5995581"]),
    "2015": ("FIAT", "Uno / CS / Prêmio / Elba", "01/85 - 12/95", "DIANTEIRO", 400, ["7725169"]),
    "2024": ("IVECO", "Daily Turbo 35.10", "01/97 - ...", "TRASEIRO", 300, ["93822394"]),
    "2025": ("IVECO", "Daily Turbo 35.10", "01/97 - ...", "DIANTEIRO", 530, ["91817105"]),
    "2028": ("FIAT", "Brava / Marea", "01/99 - 12/03", "DIANTEIRO", 425, ["46441569"]),
    "2035": ("FIAT", "Tempra 16V / Punto", "01/95 - ...", "TRASEIRO", 525, ["7771239"]),
    "2036": ("FIAT", "Palio Weekend", "01/97 - ...", "TRASEIRO", 240, ["82442878"]),
    "2108": ("FIAT", "Ducato", "01/98 - 12/05", "DIANTEIRO", 490, ["46786431"]),
    "2109": ("FIAT", "Ducato", "01/98 - 12/05", "TRASEIRO", 380, ["46786432"]),
    "2110": ("FIAT", "Palio Weekend", "01/97 - ...", "TRASEIRO", 250, ["82442878"]),
    "2112": ("FIAT", "Strada", "01/09 - 12/15", "TRASEIRO", 400, ["7758294"]),
    "2113": ("FIAT", "Idea / Idea Adventure / Strada", "01/06 - 12/15", "DIANTEIRO", 513, ["51739692"]),
    "2114": ("FIAT", "Punto", "01/08 - 12/15", "DIANTEIRO", 445, ["51783307"]),
    "2116": ("FIAT", "Stilo", "01/02 - 12/12", "DIANTEIRO", 434, ["46.554.126"]),
    "2118": ("FIAT", "Stilo", "01/02 - 12/12", "TRASEIRO", 240, ["46808796"]),
    "2121": ("FIAT", "Palio Adventure / Palio Weekend", "01/97 - 12/14", "TRASEIRO", 400, ["46556013"]),
    "2122": ("FIAT", "Ducato Multijet", "01/06 - 12/12", "DIANTEIRO", 490, ["46786435"]),
    "2123": ("FIAT", "Doblò", "01/02 - 12/15", "DIANTEIRO", 495, ["46738613"]),
    "2126": ("FIAT", "Palio Novo / Grand Siena", "01/10 - 12/15", "DIANTEIRO", 530, ["51833620"]),
    "2130": ("FIAT", "Doblò Adventure / Locker", "01/04 - 12/15", "DIANTEIRO", 495, ["51717163"]),
    "2131": ("FIAT", "Doblò Adventure / Locker", "01/04 - 12/15", "DIANTEIRO", 515, ["51717163"]),
    "3036": ("FIAT", "Siena / Palio / Strada", "01/96 - ...", "DIANTEIRO", 465, ["46448474"]),
    "3042": ("FORD", "Fiesta", "01/96 - 12/02", "TRASEIRO", 350, ["96FB2282AB"]),
    "4207": ("HONDA", "Civic", "01/91 - 12/95", "DIANTEIRO", 464, ["01464SR3000"]),
    "4208": ("HONDA", "Fit", "01/04 - 12/08", "DIANTEIRO", 490, ["01468SAAOOD"]),
    "6022": ("TOYOTA", "Corolla", "01/03 - 12/08", "TRASEIRO", 270, ["9094702D15"]),
    "8215": ("RENAULT", "R19", "01/92 - 12/98", "DIANTEIRO", 290, ["7701349305"]),
    "8234": ("RENAULT", "Master", "01/02 - ...", "TRASEIRO", 555, ["8200057038"]),
    "8501": ("MITSUBISHI", "L200 / L200 Sport", "01/94 - 12/03", "TRASEIRO", 355, ["MR129595"]),
    "8502": ("MITSUBISHI", "L200 / L200 Sport", "01/94 - 12/03", "TRASEIRO", 330, ["MR129596"]),
    "8506": ("MITSUBISHI", "L200 Triton", "01/07 - ...", "TRASEIRO", 380, ["4650A227"]),
}

def clean_product_data(p: dict):
    # 1. Clean Makes
    new_makes = []
    for m in p.get('makes', []):
        cm = MAKE_CORRECTIONS.get(m, m)
        if cm not in new_makes:
            new_makes.append(cm)
    p['makes'] = new_makes

    sku = p['sku']

    # 2. Check if we have exact verified Norflex data
    if p['brand'] == 'Norflex' and sku in KNOWN_NORFLEX_MODELS:
        mk, model, years, pos, length, oems = KNOWN_NORFLEX_MODELS[sku]
        p['makes'] = [mk]
        p['specs']['position'] = pos
        p['specs']['lengthMm'] = length
        p['lengths'] = [length]
        p['positions'] = [pos]
        for o in oems:
            if o not in p['oemEquivalents']:
                p['oemEquivalents'].append(o)
        p['applications'] = [{
            "make": mk,
            "models": model,
            "years": years,
            "position": pos,
            "lengthMm": length
        }]
        p['name'] = f"Flexível de Freio {mk} {model} {pos} {length}mm"
        return

    # 3. Clean general applications
    cleaned_apps = []
    for app in p.get('applications', []):
        raw_make = app.get('make', '')
        make = MAKE_CORRECTIONS.get(raw_make, raw_make)
        if make == 'E.E.E.E E-E E.E.E.E':
            make = 'FIAT'
        app['make'] = make

        raw_model = app.get('models', '')
        # Clean corrupt makes inside model text
        for bad, good in MAKE_CORRECTIONS.items():
            if bad in raw_model:
                raw_model = raw_model.replace(bad, good)
        
        # Extract OEM numbers from model string
        oem_matches = re.findall(r'(\b\d{1,5}[\.,]\d{2,4}(?:[\.,]\d{1,4})*(?:-\d)?\b|\b\d{6,10}(?:-\d)?\b)', raw_model)
        for oem in oem_matches:
            clean_o = re.sub(r'[,]', '.', oem).strip()
            if len(re.sub(r'\D', '', clean_o)) >= 5:
                if clean_o not in p['oemEquivalents']:
                    p['oemEquivalents'].append(clean_o)
                raw_model = raw_model.replace(oem, '')

        # Extract position & length (e.g. DIANTEIR0434MM, TRASEIR0300MM, 380MM)
        pos_len_matches = re.findall(r'(?:DIANT(?:EIR[O0])?|UANTER[O0]|MANTEIR[O0]|CIAMTE[I1]R[O0]|CIAVTER[O0]|ffANTER[O0]|DIANTER[O0]|TRAS(?:EIR[O0])?|TRASER[O0]|TUSEIRO)[0-9\s]*MM?|\b\d{3,4}\s*MM\b', raw_model, re.IGNORECASE)
        for pl in pos_len_matches:
            digits = re.findall(r'\d{3,4}', pl)
            if digits:
                val = int(digits[-1])
                if 150 <= val <= 2500:
                    p['specs']['lengthMm'] = val
                    app['lengthMm'] = val
                    p['lengths'] = [val]
                if any(x in pl.upper() for x in ['DIANT', 'MANTEIR', 'UANTER', 'CIAMTE', 'CIAVTER', 'ffANTER']):
                    p['specs']['position'] = 'DIANTEIRO'
                    app['position'] = 'DIANTEIRO'
                    p['positions'] = ['DIANTEIRO']
                elif any(x in pl.upper() for x in ['TRAS', 'TRASER', 'TUSEIRO']):
                    p['specs']['position'] = 'TRASEIRO'
                    app['position'] = 'TRASEIRO'
                    p['positions'] = ['TRASEIRO']
            raw_model = raw_model.replace(pl, '')

        # Remove redundant make names in models
        parts = [part.strip() for part in re.split(r'//|/|,', raw_model) if part.strip()]
        cleaned_parts = []
        make_upper = make.upper()
        for part in parts:
            pu = part.upper()
            if pu == make_upper or pu in ['FIAT', 'FORD', 'CHEVROLET', 'GM', 'VW', 'VOLKSWAGEN', 'GERAL', 'CARRO', 'CHRYSLER', 'MERCEDES', 'RENAULT', 'TOYOTA', 'HONDA']:
                continue
            if re.match(r'^\d+$', part):
                continue
            cleaned_parts.append(part)

        cleaned_model = ' / '.join(cleaned_parts)
        cleaned_model = re.sub(r'\bTEMPWTIPO\b', 'Tipo / Tempra', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r'\bFCRDRANGER\b', 'Ranger', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r'\bUNOSX/WI\b', 'Uno SX / Mille', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r"\bU'OS/CS/PREMIO/ELBA\b", 'Uno / Prêmio / Elba', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r'\bESPORT\.\b', 'Esporte', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r'\bREUULT\b', 'Renault', cleaned_model, flags=re.IGNORECASE)
        cleaned_model = re.sub(r'\bMITSIBISHI\b', 'Mitsubishi', cleaned_model, flags=re.IGNORECASE)

        cleaned_model = cleaned_model.strip(' /-,')
        if not cleaned_model or cleaned_model in ['1', 'WE', 'IRO', 'EIRO', 'CARRO']:
            cleaned_model = f"{make} (Aplicação Técnica)"

        app['models'] = cleaned_model
        cleaned_apps.append(app)

    p['applications'] = cleaned_apps

    # Update product name if it had corrupt text
    for bad, good in MAKE_CORRECTIONS.items():
        if bad in p['name']:
            p['name'] = p['name'].replace(bad, good)
    if '4655mm' in p['name'] and p['sku'] == '2116':
        p['name'] = "Flexível de Freio Fiat Stilo Dianteiro 434mm"

# Process all products
for p in products:
    clean_product_data(p)

# Save cleaned master seed
with open('src/data/catalog-master-seed.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("Saved cleaned catalog-master-seed.json!")
