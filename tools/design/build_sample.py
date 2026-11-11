import random, math
random.seed(7)
def cols(x0,x1,n,y,h,w,fill):
    step=(x1-x0-w)/(n-1)
    return "".join(f'<rect x="{x0+i*step:.2f}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>' for i in range(n))
L1,L2,RIM,WIN="var(--land1)","var(--land2)","var(--rim)","var(--win)"
stars="".join(f'<circle class="tw" style="animation-delay:{random.uniform(0,4):.1f}s" cx="{random.uniform(6,384):.0f}" cy="{random.uniform(6,100):.0f}" r="{random.choice([.6,.8,.8,1,1.3])}"/>' for _ in range(34))
rays="".join(f'<path d="M195 196 L{195+300*math.sin(math.radians(a-4)):.0f} {196-300*math.cos(math.radians(a-4)):.0f} L{195+300*math.sin(math.radians(a+4)):.0f} {196-300*math.cos(math.radians(a+4)):.0f}z"/>' for a in range(-75,76,25))
def cloud(x,y,s,o,cls=""):
    e=[(0,0,46,6),(-20,-4,22,6),(14,-6,26,7),(44,-2,22,4.5),(-44,1,18,3.5)]
    return f'<g class="{cls}" opacity="{o}" transform="translate({x} {y}) scale({s})">'+"".join(f'<ellipse cx="{a}" cy="{b}" rx="{c}" ry="{d}" fill="url(#cl)"/>' for a,b,c,d in e)+'</g>'
def tree(x,y,r):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="var(--tree1)"/><circle cx="{x+r*.22:.1f}" cy="{y-r*.28:.1f}" r="{r*.62:.1f}" fill="var(--tree2)"/><path d="M{x+r*.25:.1f} {y-r*.97:.1f} A{r} {r} 0 0 1 {x+r*.97:.1f} {y-r*.25:.1f}" stroke="{RIM}" stroke-width=".8" fill="none" opacity=".55"/>'
def flag(x,h):
    return f'<path d="M{x} 196V{196-h}" stroke="var(--tree1)" stroke-width=".7"/><path d="M{x} {196-h} q1.6 -.9 3.2 0 t3 0 v2.6 q-1.5 -.9 -3 0 t-3.2 0z" fill="var(--flag)"/>'
flags="".join(flag(x,10+ (1.5 if 180<x<212 else 0)) for x in [166,172,178,184,206,212,218,224])
lincoln=f'''<g>
<rect x="24" y="158" width="84" height="23" fill="{L2}"/>{cols(25,107,12,158,23,3.6,L1)}
<rect x="22" y="152" width="88" height="6" fill="{L1}"/><rect x="21" y="151" width="90" height="1.4" fill="{RIM}" opacity=".8"/>
<rect x="30" y="140" width="72" height="12" fill="{L1}"/><rect x="29" y="139" width="74" height="1.4" fill="{RIM}" opacity=".8"/>
{"".join(f'<rect x="{34+i*7.4:.1f}" y="144" width="4.6" height="2.2" rx="1.1" fill="{L2}"/>' for i in range(9))}
<rect x="100" y="140" width="2" height="12" fill="{RIM}" opacity=".35"/><rect x="108" y="152" width="2" height="6" fill="{RIM}" opacity=".35"/>
<rect x="22" y="181" width="88" height="4" fill="{L1}"/><rect x="18" y="185" width="96" height="5" fill="{L2}"/><rect x="14" y="190" width="104" height="6" fill="{L1}"/>
<rect x="18" y="185" width="96" height=".8" fill="{RIM}" opacity=".5"/><rect x="14" y="190" width="104" height=".8" fill="{RIM}" opacity=".5"/>
<rect x="60" y="166" width="12" height="15" fill="{WIN}" opacity=".35"/>
</g>'''
monument=f'''<g>
<path d="M187.5 196 L190.4 84 L195 70 L195 196z" fill="{L1}"/><path d="M195 70 L199.6 84 L202.5 196 L195 196z" fill="{L2}"/>
<path d="M187.5 196 L190.4 84 L195 70 L199.6 84 L202.5 196" fill="none" stroke="{RIM}" stroke-width=".9" opacity=".75"/>
<path class="tw" d="M195 63 l1.2 5.8 5.8 1.2 -5.8 1.2 -1.2 5.8 -1.2 -5.8 -5.8 -1.2 5.8 -1.2z" fill="#fff" opacity=".9"/>
</g>'''
def wing(x):
    return f'''<rect x="{x}" y="170" width="40" height="18" fill="{L1}"/><rect x="{x+3}" y="173" width="34" height="15" fill="{L2}"/>{cols(x+3,x+37,7,173,15,2.4,L1)}
<rect x="{x-1}" y="168.6" width="42" height="2.2" fill="{L1}"/><rect x="{x-1}" y="168" width="42" height=".9" fill="{RIM}" opacity=".8"/>
{"".join(f'<rect x="{x+6.6+i*5.27:.1f}" y="177" width="1.8" height="4" fill="{WIN}"/>' for i in range(6))}'''
ribs="".join(f'<path d="M318 98 C{318+dx*.55:.1f} 104 {318+dx*.9:.1f} 114 {318+dx} 127" stroke="{L2}" stroke-width=".7" fill="none"/>' for dx in (-8,-4,0,4,8))
capitol=f'''<g>
<path d="M274 170V158" stroke="{L2}" stroke-width=".8"/><path d="M274 158 q2 -1 4 0 t4 0 v3 q-2 -1 -4 0 t-4 0z" fill="var(--flag)"/>
<path d="M362 170V158" stroke="{L2}" stroke-width=".8"/><path d="M362 158 q2 -1 4 0 t4 0 v3 q-2 -1 -4 0 t-4 0z" fill="var(--flag)"/>
<path d="M307 127 C307 108 312 100 318 98 C324 100 329 108 329 127z" fill="{L1}"/>{ribs}
<path d="M318 98 C324 100 329 108 329 127 L318 127z" fill="{L2}" opacity=".35"/>
<path d="M307 127 C307 108 312 100 318 98" fill="none" stroke="{RIM}" stroke-width=".9" opacity=".8"/>
<rect x="315" y="88" width="6" height="10" fill="{L1}"/><rect x="316.2" y="90" width="1" height="7" fill="{WIN}"/><rect x="318.8" y="90" width="1" height="7" fill="{WIN}"/>
<path d="M314.4 88.4 q3.6 -6.5 7.2 0z" fill="{L1}"/><path d="M318 83V75" stroke="{L1}" stroke-width="1.3" stroke-linecap="round"/><circle cx="318" cy="74.4" r="1.3" fill="{L1}"/>
<rect x="305" y="125.6" width="26" height="2.2" fill="{L1}"/>
<rect x="306" y="128" width="24" height="8" fill="{L1}"/>{"".join(f'<rect x="{308+i*3.1:.1f}" y="130" width="1.4" height="4" fill="{WIN}"/>' for i in range(7))}
<rect x="302" y="135.6" width="32" height="2.6" fill="{L1}"/><rect x="302" y="135.2" width="32" height=".9" fill="{RIM}" opacity=".8"/>
<rect x="304" y="138" width="28" height="14" fill="{L2}"/>{cols(304,332,10,138,14,1.6,L1)}
<rect x="301" y="151" width="34" height="3" fill="{L1}"/>
<rect x="294" y="174" width="10" height="14" fill="{L2}"/><rect x="332" y="174" width="10" height="14" fill="{L2}"/>
{wing(254)}{wing(342)}
<rect x="300" y="164" width="36" height="24" fill="{L1}"/><rect x="303" y="166" width="30" height="22" fill="{L2}"/>{cols(303,333,6,166,22,2.6,L1)}
<path d="M298 164.5 L318 154 L338 164.5z" fill="{L1}"/><path d="M298 164.5 L318 154 L338 164.5" fill="none" stroke="{RIM}" stroke-width=".9" opacity=".8"/>
<rect x="314" y="174" width="8" height="14" fill="{WIN}" opacity=".5"/>
<rect x="250" y="188" width="136" height="8" fill="{L1}"/><rect x="250" y="188" width="136" height=".9" fill="{RIM}" opacity=".7"/>
<path d="M308 196 L310 188 H326 L328 196z" fill="{L2}"/><path d="M309 192.5H327M308.4 194.5H327.6M309.6 190.5H326.4" stroke="{L1}" stroke-width=".7"/>
{"".join(f'<rect x="{256+i*9.4:.1f}" y="190.6" width="2" height="3.4" fill="{L2}"/>' for i in range(5))}{"".join(f'<rect x="{336+i*9.4:.1f}" y="190.6" width="2" height="3.4" fill="{L2}"/>' for i in range(5))}
</g>'''
ripples="".join(f'<path class="rp" style="animation-delay:{random.uniform(0,3):.1f}s" d="M{x} {y}h{w}"/>' for x,y,w in [(150,206,14),(222,208,18),(136,214,20),(236,216,12),(116,222,16),(250,224,22),(100,229,14),(274,230,16),(160,226,10)])
glint="".join(f'<path class="rp" style="animation-delay:{i*.35:.2f}s" d="M{195-w/2} {y}h{w}"/>' for i,(y,w) in enumerate([(204,10),(208,16),(212,12),(217,22),(222,16),(227,28)]))
far="M0 196 V186 q10 -8 20 0 q8 -6 16 0 h10 v-8 h3 v-6 h2 v6 h3 v8 h14 q10 -9 20 0 q9 -7 18 0 h12 v-10 h8 v10 h10 q10 -8 20 0 q8 -6 16 0 h30 q10 -8 20 0 h14 v-12 h3 v-5 h2 v5 h3 v12 h12 q9 -7 18 0 q10 -8 20 0 h16 v-7 h10 v7 q10 -8 20 0 q8 -6 16 0 V196z"
scene=f'''<svg viewBox="0 0 390 300" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s1)"/><stop offset=".2" style="stop-color:var(--s2)"/><stop offset=".4" style="stop-color:var(--s3)"/><stop offset=".54" style="stop-color:var(--s4)"/><stop offset=".63" style="stop-color:var(--s5)"/><stop offset=".67" style="stop-color:var(--s6)"/></linearGradient>
<radialGradient id="glow"><stop offset="0" style="stop-color:var(--sun)" stop-opacity=".95"/><stop offset=".3" style="stop-color:var(--glow)" stop-opacity=".6"/><stop offset="1" style="stop-color:var(--glow)" stop-opacity="0"/></radialGradient>
<linearGradient id="cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--cloud-a)"/><stop offset="1" style="stop-color:var(--cloud-b)"/></linearGradient>
<linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pool1)"/><stop offset="1" style="stop-color:var(--pool2)"/></linearGradient>
<linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lawn)"/><stop offset="1" style="stop-color:var(--lawn2)"/></linearGradient>
<linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--land2)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--land2)" stop-opacity="0"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" style="stop-color:var(--page)" stop-opacity="0"/><stop offset=".86" style="stop-color:var(--page)"/></linearGradient>
<clipPath id="above"><rect width="390" height="196"/></clipPath>
<clipPath id="poolc"><path d="M124 200 H266 L318 236 H72z"/></clipPath>
</defs>
<rect width="390" height="300" fill="url(#sky)"/>
<g fill="#fff" style="opacity:var(--star-o)">{stars}</g>
<g clip-path="url(#above)"><circle cx="195" cy="196" r="150" fill="url(#glow)"/><g fill="#fff" opacity=".07">{rays}</g><circle cx="195" cy="196" r="27" fill="var(--sun)" style="opacity:var(--sun-o)"/></g>
{cloud(78,96,1,.75,"dr")}{cloud(312,118,.9,.8,"dr2")}{cloud(210,58,.6,.45,"dr")}{cloud(20,132,.7,.6,"dr2")}{cloud(352,66,.5,.4,"dr")}
<g fill="none" stroke="var(--bird)" stroke-width="1.3" stroke-linecap="round" opacity=".6"><path d="M246 84q3.5-4 7 0q3.5-4 7 0"/><path d="M268 96q2.6-3 5.2 0q2.6-3 5.2 0"/><path d="M232 100q2.6-3 5.2 0q2.6-3 5.2 0"/><path d="M258 108q2-2.4 4 0q2-2.4 4 0"/></g>
<path d="{far}" fill="var(--far)" opacity=".6"/>
{lincoln}{capitol}
{tree(2,187,13)}{tree(126,190,9)}{tree(138,186,13)}{tree(152,191,9)}{tree(234,191,9)}{tree(244,187,12)}{tree(388,188,12)}
{flags}{monument}
<rect x="0" y="196" width="390" height="104" fill="url(#lawn)"/>
<path d="M0 197 H390" stroke="{RIM}" stroke-width=".8" opacity=".5"/>
<path d="M124 200 H266 L318 236 H72z" fill="url(#pool)"/>
<g clip-path="url(#poolc)"><path d="M188 200 H202 L200.5 236 H189.5z" fill="url(#refl)"/>
<g stroke="var(--sun)" stroke-width="1.4" stroke-linecap="round">{glint}</g>
<g stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7">{ripples}</g></g>
<path d="M124 200 H266 L318 236 M124 200 L72 236" fill="none" stroke="#fff" stroke-width="1" opacity=".55"/>
<rect width="390" height="300" fill="url(#fade)"/>
</svg>'''
tracker="".join(f'<svg class="st{" on" if i<7 else ""}" viewBox="0 0 24 24"><path d="M12 2.6l2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 17.2l-5.8 3.2 1.3-6.5L2.7 9.4l6.5-.8z"/></svg>' for i in range(12))
html=open("tools/design/sample-template.html").read().replace("%%SCENE%%",scene).replace("%%STARS%%",tracker)
open("preview/sample-drill.html","w").write(html)
print(len(html))
