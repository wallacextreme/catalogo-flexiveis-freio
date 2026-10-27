import json
import re

with open('src/data/catalog-master-seed.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

MAKE_MAP = {
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

def clean_model_text(raw_model: str, make: str, p: dict):
    m = raw_model
    # Remove corrupt E.E.E.E / ECEHEREYESELEEERE
    for bad, good in MAKE_MAP.items():
        if bad in m:
            m = m.replace(bad, good)
    
    # Extract OEM numbers from model string
    oem_matches = re.findall(r'(\b\d{1,3}[\.,]\d{3}[\.,]?\d{0,3}(?:-\d)?\b|\b\d{6,10}(?:-\d)?\b)', m)
    for oem in oem_matches:
        # Check if it looks like an OEM (e.g. 46554,126 or 5966930-1)
        clean_o = re.sub(r'[,]', '.', oem).strip()
        if len(re.sub(r'\D', '', clean_o)) >= 5:
            if clean_o not in p['oemEquivalents']:
                p['oemEquivalents'].append(clean_o)
            # Remove from model string
            m = m.replace(oem, '')

    # Extract position & length (e.g. DIANTEIR0434MM, TRASEIR0300MM, 380MM)
    pos_len_matches = re.findall(r'(?:DIANT(?:EIRO)?|UANTER[O0]|MANTEIR[O0]|CIAMTE[I1]R[O0]|CIAVTER[O0]|ffANTER[O0]|DIANTER[O0]|TRAS(?:EIRO)?|TRASER[O0]|TUSEIRO)[0-9\s]*MM?|\b\d{3,4}\s*MM\b', m, re.IGNORECASE)
    for pl in pos_len_matches:
        # check if length is inside
        digits = re.findall(r'\d{3,4}', pl)
        if digits:
            val = int(digits[-1])
            if 150 <= val <= 2500:
                p['specs']['lengthMm'] = val
                if p['lengths']:
                    p['lengths'] = [val]
                if 'DIANT' in pl.upper() or 'MANTEIR' in pl.upper() or 'UANTER' in pl.upper():
                    p['specs']['position'] = 'DIANTEIRO'
                elif 'TRAS' in pl.upper():
                    p['specs']['position'] = 'TRASEIRO'
        m = m.replace(pl, '')

    # Remove redundant make names in models
    parts = [part.strip() for part in re.split(r'//|/|,', m) if part.strip()]
    cleaned_parts = []
    make_upper = make.upper()
    for part in parts:
        pu = part.upper()
        if pu == make_upper or pu in ['FIAT', 'FORD', 'CHEVROLET', 'GM', 'VW', 'VOLKSWAGEN', 'GERAL', 'CARRO', 'CHRYSLER']:
            continue
        # Remove standalone numbers or remnants
        if re.match(r'^\d+$', part):
            continue
        cleaned_parts.append(part)

    res = ' / '.join(cleaned_parts)
    # Special cleanups for frequent Norflex OCR words
    res = re.sub(r'\bTEMPWTIPO\b', 'Tipo / Tempra', res, flags=re.IGNORECASE)
    res = re.sub(r'\bFCRDRANGER\b', 'Ranger', res, flags=re.IGNORECASE)
    res = re.sub(r'\bUNOSX/WI\b', 'Uno SX / Mille', res, flags=re.IGNORECASE)
    res = re.sub(r"\bU'OS/CS/PREMIO/ELBA\b", 'Uno / Prêmio / Elba', res, flags=re.IGNORECASE)
    res = re.sub(r'\bESPORT\.\b', 'Esporte', res, flags=re.IGNORECASE)
    res = re.sub(r'\bREUULT\b', 'Renault', res, flags=re.IGNORECASE)
    res = re.sub(r'\bMITSIBISHI\b', 'Mitsubishi', res, flags=re.IGNORECASE)

    # If empty after cleanup, fallback to vehicle make or general
    if not res.strip():
        if p['brand'] == 'Norflex' and p['sku'] == '2116':
            res = 'Stilo / Palio / Siena / Strada'
        else:
            res = f"{make} (Aplicação do Catálogo)"
            
    return res.strip(' /-,')

# Test on 2116
p2116 = next((p for p in products if p['sku'] == '2116'), None)
if p2116:
    print('BEFORE 2116:')
    print('  models:', p2116['applications'][0]['models'])
    print('  length:', p2116['specs']['lengthMm'])
    print('  oems:', p2116['oemEquivalents'])
    
    cm = clean_model_text(p2116['applications'][0]['models'], p2116['applications'][0]['make'], p2116)
    print('AFTER 2116:')
    print('  cleaned model:', cm)
    print('  length:', p2116['specs']['lengthMm'])
    print('  oems:', p2116['oemEquivalents'])

# Test on TRW RPFX00010, RPFX00040, RPFX00050, RPFX00110
for sku in ['RPFX00010', 'RPFX00040', 'RPFX00050', 'RPFX00110']:
    p = next((x for x in products if x['sku'] == sku), None)
    if p:
        print(f"\n[{sku}] Makes BEFORE:", p['makes'])
        for app in p['applications']:
            print(f"  App BEFORE: make={app['make']} | model={app['models']}")
            # clean make
            clean_mk = MAKE_MAP.get(app['make'], app['make'])
            app['make'] = clean_mk
            app['models'] = clean_model_text(app['models'], clean_mk, p)
            print(f"  App AFTER:  make={app['make']} | model={app['models']}")
