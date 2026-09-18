import re

with open('client/src/components/MuseumExperience.tsx', 'r') as f:
    content = f.read()

new_svg = '''            <svg className="mini-map-svg" viewBox="0 0 240 380" role="img" aria-label="Map of Anagha's exhibition rooms">
              {secretUnlocked && <rect className="mini-map-floor mini-map-room-twelve" x="98" y="30" width="45" height="31" rx="2" />}
              {secretUnlocked && <text className="mini-map-label mini-map-secret-label" x="104" y="51">12</text>}
              <rect className="mini-map-floor mini-map-room-eleven" x="98" y="64" width="45" height="31" rx="2" />
              <text className="mini-map-label" x="104" y="85">11</text>
              <rect className="mini-map-corridor" x="112" y="95" width="17" height="17" rx="1" />
              <rect className="mini-map-floor mini-map-room-three" x="98" y="112" width="45" height="31" rx="2" />
              <text className="mini-map-label" x="104" y="133">03</text>
              <rect className="mini-map-floor mini-map-room-ten" x="144" y="112" width="44" height="31" rx="2" />
              <text className="mini-map-label" x="150" y="133">10</text>
              <rect className="mini-map-corridor" x="112" y="143" width="17" height="10" rx="1" />
              <rect className="mini-map-floor mini-map-room-two" x="98" y="153" width="45" height="31" rx="2" />
              <text className="mini-map-label" x="104" y="174">02</text>
              <rect className="mini-map-floor" x="52" y="153" width="44" height="31" rx="2" style={{opacity: 0.4}} />
              <text style={{fontSize: '9px', opacity: 0.5, fill: 'var(--map-label)'}} x="58" y="174">🧹 04</text>
              <rect className="mini-map-corridor" x="112" y="184" width="17" height="17" rx="1" />
              <rect className="mini-map-floor" x="98" y="201" width="45" height="34" rx="2" />
              <text className="mini-map-label" x="104" y="222">01</text>
              <rect className="mini-map-floor mini-map-side-room" x="68" y="203" width="29" height="30" rx="2" />
              <text className="mini-map-wing-label" x="71" y="222">07</text>
              <rect className="mini-map-floor mini-map-side-room" x="38" y="203" width="29" height="30" rx="2" />
              <text className="mini-map-wing-label" x="41" y="222">08</text>
              <rect className="mini-map-floor mini-map-side-room" x="8" y="203" width="29" height="30" rx="2" />
              <text className="mini-map-wing-label" x="11" y="222">09</text>
              <rect className="mini-map-floor mini-map-side-room" x="144" y="203" width="29" height="30" rx="2" />
              <text className="mini-map-wing-label" x="147" y="222">05</text>
              <rect className="mini-map-floor mini-map-side-room" x="174" y="203" width="29" height="30" rx="2" />
              <text className="mini-map-wing-label" x="177" y="222">06</text>
              <path className="mini-map-route" d="M120 64 L120 61 M120 95 L120 112 M120 143 L120 153 M120 184 L120 201 M98 168 L96 168 M143 168 L144 168 M97 218 L68 218 M67 218 L38 218 M37 218 L8 218 M143 218 L144 218 M173 218 L174 218" />
            </svg>'''

# Replace the entire svg block
content = re.sub(
    r'<svg className="mini-map-svg".*?</svg>',
    new_svg,
    content,
    flags=re.DOTALL
)

with open('client/src/components/MuseumExperience.tsx', 'w') as f:
    f.write(content)

print("DONE")
# Note: after running this, also update the player dot style in the JSX:
# Find:   style={{ left: `${4 + Math.max(0, Math.min(1, (mapPlayer.x + 40) / 71)) * 92}%`
# The player dot uses CSS % positioning on the map frame div, not SVG coords
# so it needs recalibrating too - but that's a separate step
