import React from "react";

/**
 * 科研鼠鼠 · 动态分层卡通吉祥物（延续左上角特工鼠 Logo 形象：
 * 大粉耳 + 卡其棒球帽 + 战术耳麦 + 小门牙 + 双爪捧发光 Skills 文件夹）
 *
 * @param {object} props
 * @param {"idle"|"thinking"|"active"} [props.mode="idle"] 动作状态
 * @param {number} [props.size=58] 渲染尺寸（px）
 * @param {{x:number, y:number}} [props.lookOffset] 眼珠跟随偏移（-2.2 ~ 2.2）
 */
export function HamsterMascot({
  mode = "idle",
  size = 58,
  lookOffset = { x: 0, y: 0 },
}) {
  const ex = Math.max(-2.2, Math.min(2.2, Number(lookOffset?.x) || 0));
  const ey = Math.max(-1.6, Math.min(1.6, Number(lookOffset?.y) || 0));

  return (
    <svg
      className={`hamster-mascot mascot-${mode}`}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {/* 背景战术斜三角辉光底板 */}
      <g className="mascot-bg-tri">
        <polygon
          points="66,10 110,88 18,92"
          fill="#0c3b2e"
          stroke="#34d399"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </g>

      <g className="mascot-body-bob">
        {/* 身后俏皮摇摆的粉色长尾巴 */}
        <g className="mascot-tail">
          <path
            d="M28 92 C10 84, 10 60, 24 54 C30 51, 28 60, 22 65 C17 70, 20 81, 32 86 Z"
            fill="#f4979c"
            stroke="#1e242b"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 卡其战术小背包 */}
        <rect
          x="22"
          y="72"
          width="18"
          height="24"
          rx="5"
          transform="rotate(-12 31 84)"
          fill="#8f7e5e"
          stroke="#1e242b"
          strokeWidth="3.6"
        />
        <line
          x1="23"
          y1="82"
          x2="38"
          y2="79"
          stroke="#1e242b"
          strokeWidth="2.6"
        />

        {/* 深炭灰连帽卫衣躯干 */}
        <path
          d="M34 72 C34 62, 80 62, 82 74 L86 102 L30 102 Z"
          fill="#2d3540"
          stroke="#1e242b"
          strokeWidth="3.8"
          strokeLinejoin="round"
        />

        {/* 右侧大圆耳（后层） */}
        <g className="mascot-ear-right">
          <circle
            cx="89"
            cy="39"
            r="17"
            fill="#9ca5af"
            stroke="#1e242b"
            strokeWidth="3.8"
          />
          <circle cx="90" cy="41" r="11" fill="#f7a3a6" />
        </g>

        {/* 左侧大圆耳（前层） */}
        <g className="mascot-ear-left">
          <circle
            cx="32"
            cy="35"
            r="20"
            fill="#9ca5af"
            stroke="#1e242b"
            strokeWidth="3.8"
          />
          <circle cx="31" cy="36" r="13.5" fill="#f7a3a6" />
        </g>

        {/* 头部主体（上灰下白双色脸颊） */}
        <g className="mascot-head">
          <path
            d="M35 46 C35 25, 85 25, 87 48 C90 65, 79 76, 62 76 C43 76, 33 65, 35 46 Z"
            fill="#9ca5af"
            stroke="#1e242b"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          {/* 雪白下半脸颊 */}
          <path
            d="M38 56 C44 50, 56 54, 65 56 C74 54, 83 52, 86 58 C84 70, 74 75, 61 75 C46 75, 38 68, 38 56 Z"
            fill="#f8fafc"
          />

          {/* 卡其色战术棒球帽 */}
          <path
            d="M40 36 C44 21, 74 20, 82 34 Z"
            fill="#9e9072"
            stroke="#1e242b"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* 帽檐 */}
          <path
            d="M52 33 C66 29, 89 32, 95 40 C83 41, 67 39, 52 35 Z"
            fill="#83765b"
            stroke="#1e242b"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />

          {/* 眼部与自信斜眉 + 眼珠跟随 + 眨眼遮罩 */}
          <g className="mascot-eyes">
            {/* 左眼（画面偏中左） */}
            <ellipse cx="57" cy="51" rx="6.2" ry="5.5" fill="#1e242b" />
            <g transform={`translate(${ex}, ${ey})`}>
              <circle cx="58.5" cy="50" r="2.2" fill="#ffffff" />
            </g>
            {/* 右眼（画面偏右） */}
            <ellipse cx="76" cy="52" rx="4.8" ry="4.6" fill="#1e242b" />
            <g transform={`translate(${ex}, ${ey})`}>
              <circle cx="77" cy="51" r="1.8" fill="#ffffff" />
            </g>
            {/* 自信眉线 */}
            <path
              d="M49 44 L64 48 M71 48 L82 45"
              stroke="#1e242b"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* 眨眼眼睑 */}
            <rect
              className="mascot-eyelid"
              x="48"
              y="43"
              width="36"
              height="14"
              rx="4"
              fill="#9ca5af"
            />
          </g>

          {/* 粉红小鼻头 + 微笑小门牙 + 胡须 */}
          <polygon points="66,57 72,57 69,61.5" fill="#f27885" />
          {/* 两颗标志性白色小兔牙 */}
          <rect
            x="63.5"
            y="64"
            width="5.5"
            height="5"
            rx="1.2"
            fill="#ffffff"
            stroke="#1e242b"
            strokeWidth="2"
          />
          <line x1="66.3" y1="64" x2="66.3" y2="69" stroke="#1e242b" strokeWidth="1.6" />
          <path
            d="M59 62.5 Q65 66 72 63"
            fill="none"
            stroke="#1e242b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* 左右胡须 */}
          <g className="mascot-whiskers" stroke="#1e242b" strokeWidth="2" strokeLinecap="round">
            <line x1="43" y1="58" x2="52" y2="60" />
            <line x1="42" y1="63" x2="51" y2="63" />
            <line x1="81" y1="59" x2="91" y2="58" />
            <line x1="81" y1="63" x2="90" y2="64" />
          </g>

          {/* 战术耳麦（头梁 + 耳罩 + 带呼吸绿灯的麦克风杆） */}
          <path
            d="M36 44 C38 24, 64 20, 74 26"
            fill="none"
            stroke="#1e242b"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <rect
            x="29"
            y="41"
            width="13"
            height="19"
            rx="4.5"
            transform="rotate(10 35 50)"
            fill="#756b54"
            stroke="#1e242b"
            strokeWidth="3.6"
          />
          <path
            d="M37 58 Q45 68 56 69"
            fill="none"
            stroke="#1e242b"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <rect
            x="53"
            y="66"
            width="8"
            height="5.5"
            rx="2.5"
            fill="#1e242b"
          />
          <circle className="mascot-mic-led" cx="57" cy="68.7" r="1.7" fill="#34d399" />
        </g>

        {/* 怀抱的发光薄荷绿 Skills 战术文件夹 + 两只小手套肉爪 */}
        <g className="mascot-folder-group">
          <path
            d="M52 74 L68 74 L72 78 L98 78 L92 108 L46 108 Z"
            fill="#5eead4"
            stroke="#1e242b"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          {/* 文件夹底部深绿装饰条 */}
          <polygon points="48,100 93,100 91,108 46,108" fill="#0d9f6e" />
          <text
            x="69"
            y="94.5"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="12"
            fontWeight="900"
            fontStyle="italic"
            fill="#0f172a"
          >
            Skills
          </text>

          {/* 左小肉爪（半指黑手套 + 白爪尖） */}
          <g>
            <ellipse
              cx="50"
              cy="94"
              rx="7.5"
              ry="6.5"
              fill="#2d3540"
              stroke="#1e242b"
              strokeWidth="3.2"
            />
            <circle cx="55" cy="92" r="2.6" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
            <circle cx="55" cy="96" r="2.6" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
          </g>
          {/* 右小肉爪 */}
          <g>
            <ellipse
              cx="94"
              cy="94"
              rx="6.8"
              ry="6"
              fill="#2d3540"
              stroke="#1e242b"
              strokeWidth="3.2"
            />
            <circle cx="89.5" cy="92" r="2.4" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
            <circle cx="89.5" cy="96" r="2.4" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
          </g>
        </g>
      </g>
    </svg>
  );
}
