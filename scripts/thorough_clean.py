import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# 1. Official clean automaker names mapping
MAKE_REPLACEMENTS = {
    "ECEHEREYESELEEERE": "CHRYSLER",
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

# 2. Curated Norflex applications from official Index (pages 2-22)
NORFLEX_INDEX_MAP = {
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
    "2117": ("FIAT", "Stilo", "01/02 - 12/12", "DIANTEIRO", 434, ["46554126"]),
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

def clean_make_name(m: str) -> str:
    if not m:
        return "GERAL"
    m_clean = MAKE_REPLACEMENTS.get(m, m)
    if m_clean.startswith("ECEIET"):
        return "CITROËN"
    if m_clean.startswith("ECE"):
        return "CHRYSLER"
    if m_clean.startswith("EFE"):
        return "FIAT"
    if m_clean.startswith("EGE"):
        return "CHEVROLET"
    if m_clean.startswith("EME"):
        return "MERCEDES-BENZ"
    if "E.E.E.E" in m_clean or "E-E" in m_clean:
        return "FIAT"
    return m_clean.strip()

def clean_model_and_extract(raw: str, make: str, p: dict) -> str:
    m = raw
    # 1. Clean corrupt make names
    for bad, good in MAKE_REPLACEMENTS.items():
        if bad in m:
            m = m.replace(bad, good)
    if "ECEIET" in m:
        m = re.sub(r'ECEIET\S*', 'CITROËN', m)
    if "E.E.E.E" in m or "E-E" in m:
        m = m.replace("E.E.E.E", "").replace("E-E", "").strip()

    # 2. Extract and remove OEM numbers (e.g. 46554,126, 5.966.930-1, 8208102)
    oem_candidates = re.findall(r'(\b\d{1,5}[\.,]\d{2,4}(?:[\.,]\d{1,4})*(?:-\d)?\b|\b\d{6,10}(?:-\d)?\b)', m)
    for cand in oem_candidates:
        clean_o = cand.replace(',', '.').strip()
        digits = re.sub(r'\D', '', clean_o)
        if len(digits) >= 5:
            if clean_o not in p['oemEquivalents']:
                p['oemEquivalents'].append(clean_o)
            m = m.replace(cand, '')

    # 3. Extract and remove position & length tokens
    # e.g. DIANTEIR0434MM, TRASEIR0300MM, 380MM, MANTEIR0360
    pos_len_tokens = re.findall(
        r'(?:DIANT(?:EIR[O0])?|UANTER[O0]|MANTEIR[O0]|CIAMTE[I1]R[O0]|CIAVTER[O0]|ffANTER[O0]|DIANTER[O0]|TRAS(?:EIR[O0])?|TRASER[O0]|TUSEIRO)[0-9\s]*MM?|\b\d{3,4}\s*MM\b',
        m,
        re.IGNORECASE
    )
    for pl in pos_len_tokens:
        digits = re.findall(r'\d{3,4}', pl)
        if digits:
            val = int(digits[-1])
            if 150 <= val <= 2500:
                p['specs']['lengthMm'] = val
                p['lengths'] = [val]
            if any(x in pl.upper() for x in ['DIANT', 'MANTEIR', 'UANTER', 'CIAMTE', 'CIAVTER', 'ffANTER']):
                p['specs']['position'] = 'DIANTEIRO'
                p['positions'] = ['DIANTEIRO']
            elif any(x in pl.upper() for x in ['TRAS', 'TRASER', 'TUSEIRO']):
                p['specs']['position'] = 'TRASEIRO'
                p['positions'] = ['TRASEIRO']
        m = m.replace(pl, '')

    # 4. Remove redundant make names and separators
    parts = [part.strip() for part in re.split(r'//|/|,', m) if part.strip()]
    cleaned_parts = []
    make_up = make.upper()
    filter_words = {'FIAT', 'FORD', 'CHEVROLET', 'GM', 'VW', 'VOLKSWAGEN', 'GERAL', 'CARRO', 'CHRYSLER', 'MERCEDES', 'RENAULT', 'TOYOTA', 'HONDA', 'MITSUBISHI', 'IVECO', 'PEUGEOT', 'CITROEN', 'CITROËN'}
    
    for part in parts:
        pu = part.upper()
        if pu == make_up or pu in filter_words:
            continue
        # Only ignore numbers that have 5 or more digits (OEM/part numbers)
        # Numbers with 2-4 digits are real vehicle models (e.g. 147, 608, 709, 1113, 1313)!
        if re.match(r'^\d{5,}$', part):
            continue
        # ignore short OCR remnants
        if len(part) <= 2 and part not in ['SX', 'CS', 'GL', 'GT']:
            continue
        cleaned_parts.append(part)

    res = ' / '.join(cleaned_parts)

    # 5. Fix known common OCR misspellings
    res = re.sub(r'\bTEMPWTIPO\b', 'Tipo / Tempra', res, flags=re.IGNORECASE)
    res = re.sub(r'\bFCRDRANGER\b', 'Ranger', res, flags=re.IGNORECASE)
    res = re.sub(r'\bUNOSX/WI\b', 'Uno SX / Mille', res, flags=re.IGNORECASE)
    res = re.sub(r"\bU'OS/CS/PREMIO/ELBA\b", 'Uno / Prêmio / Elba', res, flags=re.IGNORECASE)
    res = re.sub(r'\bESPORT\.\b', 'Esporte', res, flags=re.IGNORECASE)
    res = re.sub(r'\bREUULT\b', 'Renault', res, flags=re.IGNORECASE)
    res = re.sub(r'\bMITSIBISHI\b', 'Mitsubishi', res, flags=re.IGNORECASE)
    res = re.sub(r'\bSW/WEEKEMJ\b', 'Palio Weekend', res, flags=re.IGNORECASE)
    res = re.sub(r'\bFIAI\b', 'Fiat', res, flags=re.IGNORECASE)
    res = re.sub(r'\bFORO\b', 'Ford', res, flags=re.IGNORECASE)

    res = res.strip(' /-,')
    if not res:
        res = f"{make} (Aplicação Técnica)"
    return res

# Apply cleaning to all products
for p in products:
    sku = p['sku']

    # 1. Clean Makes array
    cleaned_makes = []
    for m in p.get('makes', []):
        cm = clean_make_name(m)
        if cm and cm not in cleaned_makes and cm != "GERAL":
            cleaned_makes.append(cm)
    p['makes'] = cleaned_makes

    # 2. Check if known Norflex SKU
    if p['brand'] == 'Norflex' and sku in NORFLEX_INDEX_MAP:
        mk, model, years, pos, length, oems = NORFLEX_INDEX_MAP[sku]
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
        continue

    # 3. Clean applications
    for app in p.get('applications', []):
        mk = clean_make_name(app.get('make', ''))
        app['make'] = mk
        app['models'] = clean_model_and_extract(app.get('models', ''), mk, p)

    # If product has multiple applications and one of them is generic GERAL, remove the generic one
    if len(p['applications']) > 1:
        p['applications'] = [
            app for app in p['applications']
            if not (app['make'] == 'GERAL' and 'Aplicação Técnica' in app['models'])
        ] or p['applications']

    # 4. Clean product name
    for bad, good in MAKE_REPLACEMENTS.items():
        if bad in p['name']:
            p['name'] = p['name'].replace(bad, good)
    if 'ECEIET' in p['name']:
        p['name'] = re.sub(r'ECEIET\S*', 'Citroën', p['name'])
    if 'E.E.E.E' in p['name']:
        p['name'] = p['name'].replace('E.E.E.E', '').replace('E-E', '').strip()

    # If makes is empty but application has make
    if not p['makes']:
        for app in p.get('applications', []):
            if app['make'] and app['make'] != 'GERAL' and app['make'] not in p['makes']:
                p['makes'].append(app['make'])

# Save output
with open('src/data/catalog-master-seed.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("Master seed successfully cleaned and normalized!")
