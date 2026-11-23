import React from "react";

/**
 * 科研鼠鼠 · 全动作骨骼卡通吉祥物
 * 支持 8 种动作状态：
 * - idle:     待机呼吸 + 眨眼 + 抖耳朵 + 摇尾巴
 * - walk:     捧着 Skills 文件夹悠闲迈步巡逻
 * - run:      身体前倾小短腿哒哒哒全屏冲刺 + 脚底烟尘
 * - read:     停下认真翻看 Skills 文件夹 + 耳麦闪灯
 * - snack:    捧着大葵花籽腮帮鼓鼓咔嚓偷吃 + 开心音符
 * - jump:     开心跃起挥爪 + 闪烁星星
 * - sleep:    眯眼趴着打呼噜冒 Zzz 气泡
 * - thinking: 对话框内 AI 飞速检索状态
 */
export function HamsterMascot({
  mode = "idle",
  size = 64,
  facing = 1,
  showBackdrop = true,
}) {
  const isSleeping = mode === "sleep";
  const isSnack = mode === "snack";
  const isRunning = mode === "run";
  const isJumping = mode === "jump";

  return (
    <svg
      className={`hamster-mascot mascot-${mode}`}
      viewBox="0 0 128 132"
      width={size}
      height={size}
      style={facing < 0 ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      {/* 脚底柔和地面投影 */}
      <ellipse
        className="mascot-ground-shadow"
        cx="64"
        cy="122"
        rx={isRunning ? "30" : "25"}
        ry="5.5"
        fill="rgba(15, 23, 42, 0.2)"
      />

      {/* 背景战术斜三角辉光底板（漫游跑动时可隐藏，停靠/头像时显示） */}
      {showBackdrop && (
        <g className="mascot-bg-tri">
          <polygon
            points="68,10 114,92 20,96"
            fill="#0c3b2e"
            stroke="#34d399"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* 冲刺跑动时的脚后跟小烟尘特效 */}
      {isRunning && (
        <g className="mascot-dust" fill="#cbd5e1" opacity="0.85">
          <circle className="dust-1" cx="18" cy="114" r="5" />
          <circle className="dust-2" cx="10" cy="108" r="3.5" />
          <circle className="dust-3" cx="24" cy="118" r="3" />
        </g>
      )}

      <g className="mascot-rig">
        <g className="mascot-body-bob">
          {/* 身后俏皮摇摆的粉色长尾巴 */}
          <g className="mascot-tail">
            <path
              d="M32 96 C12 88, 12 64, 26 58 C32 55, 30 64, 24 69 C19 74, 22 85, 35 90 Z"
              fill="#f4979c"
              stroke="#1e242b"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* 两只可动小短腿（跑步/走路时前后交替蹬地！） */}
          <g className="mascot-leg-back">
            <ellipse
              cx="74"
              cy="113"
              rx="8.5"
              ry="5.8"
              fill="#e2e8f0"
              stroke="#1e242b"
              strokeWidth="3.2"
            />
          </g>
          <g className="mascot-leg-front">
            <ellipse
              cx="48"
              cy="114"
              rx="9"
              ry="6"
              fill="#ffffff"
              stroke="#1e242b"
              strokeWidth="3.2"
            />
          </g>

          {/* 卡其战术小背包 */}
          <rect
            x="25"
            y="74"
            width="18"
            height="24"
            rx="5"
            transform="rotate(-12 34 86)"
            fill="#8f7e5e"
            stroke="#1e242b"
            strokeWidth="3.6"
          />
          <line
            x1="26"
            y1="84"
            x2="41"
            y2="81"
            stroke="#1e242b"
            strokeWidth="2.6"
          />

          {/* 深炭灰连帽卫衣躯干 */}
          <path
            d="M37 74 C37 64, 83 64, 85 76 L88 108 C72 112, 50 112, 34 108 Z"
            fill="#2d3540"
            stroke="#1e242b"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />

          {/* 右侧大圆耳（后层） */}
          <g className="mascot-ear-right">
            <circle
              cx="92"
              cy="41"
              r="17"
              fill="#9ca5af"
              stroke="#1e242b"
              strokeWidth="3.8"
            />
            <circle cx="93" cy="43" r="11" fill="#f7a3a6" />
          </g>

          {/* 左侧大圆耳（前层） */}
          <g className="mascot-ear-left">
            <circle
              cx="35"
              cy="37"
              r="20"
              fill="#9ca5af"
              stroke="#1e242b"
              strokeWidth="3.8"
            />
            <circle cx="34" cy="38" r="13.5" fill="#f7a3a6" />
          </g>

          {/* 头部主体（上灰下白双色脸颊） */}
          <g className="mascot-head">
            <path
              d="M38 48 C38 27, 88 27, 90 50 C93 67, 82 78, 65 78 C46 78, 36 67, 38 48 Z"
              fill="#9ca5af"
              stroke="#1e242b"
              strokeWidth="3.8"
              strokeLinejoin="round"
            />
            {/* 雪白下半脸颊（吃瓜子时腮帮鼓鼓动画） */}
            <path
              className="mascot-cheeks"
              d="M41 58 C47 52, 59 56, 68 58 C77 56, 86 54, 89 60 C87 72, 77 77, 64 77 C49 77, 41 70, 41 58 Z"
              fill="#f8fafc"
            />
            {/* 腮红小粉晕（开心蹦跳或吃东西时更明显） */}
            {(isSnack || isJumping) && (
              <>
                <ellipse cx="49" cy="61" rx="4.5" ry="2.6" fill="#fda4af" opacity="0.75" />
                <ellipse cx="83" cy="61" rx="4" ry="2.4" fill="#fda4af" opacity="0.75" />
              </>
            )}

            {/* 卡其色战术棒球帽 */}
            <path
              d="M43 38 C47 23, 77 22, 85 36 Z"
              fill="#9e9072"
              stroke="#1e242b"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
            <path
              d="M55 35 C69 31, 92 34, 98 42 C86 43, 70 41, 55 37 Z"
              fill="#83765b"
              stroke="#1e242b"
              strokeWidth="3.4"
              strokeLinejoin="round"
            />

            {/* 眼部：睡眠态眯眼 vs 开心弯弯眼 vs 正常特工大眼 */}
            {isSleeping ? (
              <g stroke="#1e242b" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M53 53 Q59 58 65 53" />
                <path d="M73 53 Q78 57 83 53" />
              </g>
            ) : isJumping ? (
              <g stroke="#1e242b" strokeWidth="3.2" strokeLinecap="round" fill="none">
                <path d="M53 55 Q59 48 65 55" />
                <path d="M73 55 Q78 49 83 55" />
              </g>
            ) : (
              <g className="mascot-eyes">
                <ellipse cx="60" cy="53" rx="6.2" ry="5.5" fill="#1e242b" />
                <circle className="mascot-pupil" cx="61.5" cy="52" r="2.2" fill="#ffffff" />
                <ellipse cx="79" cy="54" rx="4.8" ry="4.6" fill="#1e242b" />
                <circle className="mascot-pupil" cx="80" cy="53" r="1.8" fill="#ffffff" />
                <path
                  d="M52 46 L67 50 M74 50 L85 47"
                  stroke="#1e242b"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <rect
                  className="mascot-eyelid"
                  x="51"
                  y="45"
                  width="36"
                  height="14"
                  rx="4"
                  fill="#9ca5af"
                />
              </g>
            )}

            {/* 粉红小鼻头 + 嘴巴/小门牙 + 胡须 */}
            <polygon points="69,59 75,59 72,63.5" fill="#f27885" />
            {!isSleeping && (
              <>
                <rect
                  className="mascot-teeth"
                  x="66.5"
                  y="66"
                  width="5.5"
                  height="5"
                  rx="1.2"
                  fill="#ffffff"
                  stroke="#1e242b"
                  strokeWidth="2"
                />
                <line x1="69.3" y1="66" x2="69.3" y2="71" stroke="#1e242b" strokeWidth="1.6" />
              </>
            )}
            <path
              d={isSleeping ? "M66 66 Q70 68 74 66" : "M62 64.5 Q68 68 75 65"}
              fill="none"
              stroke="#1e242b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <g className="mascot-whiskers" stroke="#1e242b" strokeWidth="2" strokeLinecap="round">
              <line x1="46" y1="60" x2="55" y2="62" />
              <line x1="45" y1="65" x2="54" y2="65" />
              <line x1="84" y1="61" x2="94" y2="60" />
              <line x1="84" y1="65" x2="93" y2="66" />
            </g>

            {/* 战术耳麦 */}
            <path
              d="M39 46 C41 26, 67 22, 77 28"
              fill="none"
              stroke="#1e242b"
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <rect
              x="32"
              y="43"
              width="13"
              height="19"
              rx="4.5"
              transform="rotate(10 38 52)"
              fill="#756b54"
              stroke="#1e242b"
              strokeWidth="3.6"
            />
            <path
              d="M40 60 Q48 70 59 71"
              fill="none"
              stroke="#1e242b"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <rect x="56" y="68" width="8" height="5.5" rx="2.5" fill="#1e242b" />
            <circle className="mascot-mic-led" cx="60" cy="70.7" r="1.7" fill="#34d399" />
          </g>

          {/* 手部道具切换：偷吃大瓜子 vs 捧发光 Skills 文件夹 */}
          {isSnack ? (
            <g className="mascot-snack-prop">
              {/* 大葵花籽 */}
              <path
                d="M68 68 C78 68, 82 82, 70 92 C58 82, 60 68, 68 68 Z"
                fill="#475569"
                stroke="#1e242b"
                strokeWidth="3"
              />
              <path d="M69 71 L69 88" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
              {/* 捧瓜子的两只小肉爪 */}
              <ellipse cx="60" cy="84" rx="7" ry="5.8" fill="#2d3540" stroke="#1e242b" strokeWidth="3" />
              <ellipse cx="79" cy="84" rx="7" ry="5.8" fill="#2d3540" stroke="#1e242b" strokeWidth="3" />
            </g>
          ) : (
            <g className="mascot-folder-group">
              <path
                d="M55 76 L71 76 L75 80 L101 80 L95 109 L49 109 Z"
                fill="#5eead4"
                stroke="#1e242b"
                strokeWidth="3.8"
                strokeLinejoin="round"
              />
              <polygon points="51,101 96,101 94,109 49,109" fill="#0d9f6e" />
              <text
                x="72"
                y="96.5"
                transform={facing < 0 ? "translate(144, 0) scale(-1, 1)" : undefined}
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="12"
                fontWeight="900"
                fontStyle="italic"
                fill="#0f172a"
              >
                Skills
              </text>

              {/* 左小肉爪 */}
              <g className="mascot-paw-left">
                <ellipse
                  cx="53"
                  cy="96"
                  rx="7.5"
                  ry="6.5"
                  fill="#2d3540"
                  stroke="#1e242b"
                  strokeWidth="3.2"
                />
                <circle cx="58" cy="94" r="2.5" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
                <circle cx="58" cy="98" r="2.5" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
              </g>
              {/* 右小肉爪 */}
              <g className="mascot-paw-right">
                <ellipse
                  cx="97"
                  cy="96"
                  rx="6.8"
                  ry="6"
                  fill="#2d3540"
                  stroke="#1e242b"
                  strokeWidth="3.2"
                />
                <circle cx="92.5" cy="94" r="2.4" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
                <circle cx="92.5" cy="98" r="2.4" fill="#ffffff" stroke="#1e242b" strokeWidth="1.8" />
              </g>
            </g>
          )}
        </g>

        {/* 睡眠呼噜 Zzz 漂浮特效 */}
        {isSleeping && (
          <g
            className="mascot-zzz"
            transform={facing < 0 ? "translate(194, 0) scale(-1, 1)" : undefined}
            fill="#10b981"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            <text className="zzz-1" x="92" y="30" fontSize="13">z</text>
            <text className="zzz-2" x="101" y="20" fontSize="16">Z</text>
          </g>
        )}

        {/* 开心跃起闪烁小星星特效 */}
        {isJumping && (
          <g className="mascot-stars" fill="#fbbf24">
            <polygon points="22,22 25,28 31,29 26,33 27,39 22,36 17,39 18,33 13,29 19,28" />
            <circle cx="105" cy="24" r="3.5" fill="#34d399" />
          </g>
        )}
      </g>
    </svg>
  );
}
