import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.awt.event.*;
import java.awt.geom.Path2D;
import java.io.*;
import java.net.URI;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;

/**
 * 👑 KryloOS v3.0 — Pixel-Accurate Desktop Operating System Matching Target UI
 * Features: Cybernetic Wallpaper with K-Logo, Floating Centered Dock, Glassmorphic Window Styling,
 * Live Waveform Graphs, Terminal (bash), KryloSMP Server Manager, project_notes.md, and System Monitor.
 */
public class KryloOS extends JFrame {

    private JDesktopPane desktopPane;
    private JPanel dockPanel;
    private JLabel clockLabel;
    private JPopupMenu startMenu;
    private int[] cpuHistory = new int[30];

    public KryloOS() {
        setTitle("👑 KryloOS v3.0 — Cybernetic Desktop Operating System");
        setSize(1380, 850);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        // Initialize CPU Graph data
        Random rand = new Random();
        for (int i = 0; i < cpuHistory.length; i++) {
            cpuHistory[i] = 30 + rand.nextInt(45);
        }

        // 1. Desktop Canvas with Central K-Logo Wallpaper
        desktopPane = new JDesktopPane() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g;
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                int w = getWidth();
                int h = getHeight();

                // Dark Cyber Gradient Background
                GradientPaint gp = new GradientPaint(0, 0, new Color(12, 18, 30), w, h, new Color(20, 10, 38));
                g2d.setPaint(gp);
                g2d.fillRect(0, 0, w, h);

                // Perspective Cyber Grid Lines
                g2d.setColor(new Color(0, 242, 255, 30));
                int centerX = w / 2;
                int centerY = h / 2 - 20;

                for (int x = -w; x <= w * 2; x += 80) {
                    g2d.drawLine(x, h, centerX + (x - centerX) / 4, centerY);
                }
                for (int y = centerY; y <= h; y += 40) {
                    g2d.drawLine(0, y, w, y);
                }

                // Central Orbital Logo Ring
                int ringRadius = 140;
                g2d.setColor(new Color(0, 242, 255, 80));
                g2d.setStroke(new BasicStroke(3));
                g2d.drawOval(centerX - ringRadius, centerY - ringRadius, ringRadius * 2, ringRadius * 2);

                g2d.setColor(new Color(0, 150, 255, 40));
                g2d.drawOval(centerX - ringRadius - 20, centerY - ringRadius - 20, (ringRadius + 20) * 2, (ringRadius + 20) * 2);

                // Central 'K' Emblem
                g2d.setFont(new Font("Segoe UI", Font.BOLD, 110));
                g2d.setColor(new Color(0, 242, 255, 230));
                FontMetrics fm = g2d.getFontMetrics();
                int kw = fm.stringWidth("K");
                int kh = fm.getAscent();
                g2d.drawString("K", centerX - kw / 2, centerY + kh / 3);
            }
        };
        add(desktopPane, BorderLayout.CENTER);

        // 2. Floating Centered Bottom Dock
        createFloatingDock();

        // 3. Pre-open the 4 Target Windows matching the image!
        SwingUtilities.invokeLater(() -> {
            openTerminalWindow();
            openServerManagerWindow();
            openProjectNotesWindow();
            openSystemMonitorWindow();
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FLOATING CENTERED DOCK TASKBAR
    // ──────────────────────────────────────────────────────────────────────────
    private void createFloatingDock() {
        JPanel dockContainer = new JPanel(new FlowLayout(FlowLayout.CENTER, 0, 15));
        dockContainer.setOpaque(false);

        dockPanel = new JPanel(new BorderLayout(15, 0)) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2d = (Graphics2D) g.create();
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.setColor(new Color(18, 25, 40, 235));
                g2d.fillRoundRect(0, 0, getWidth(), getHeight(), 30, 30);
                g2d.setColor(new Color(0, 242, 255, 70));
                g2d.setStroke(new BasicStroke(1.5f));
                g2d.drawRoundRect(0, 0, getWidth() - 1, getHeight() - 1, 30, 30);
                g2d.dispose();
            }
        };
        dockPanel.setOpaque(false);
        dockPanel.setBorder(BorderFactory.createEmptyBorder(6, 18, 6, 18));

        // Apps Dock Bar
        JPanel appIcons = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        appIcons.setOpaque(false);

        addDockButton(appIcons, "16:9", new Color(40, 50, 70), e -> {});
        addDockButton(appIcons, "K", new Color(0, 150, 255), e -> showStartMenu(appIcons));
        addDockButton(appIcons, "🌐", new Color(20, 120, 220), e -> openWebLink("https://krylosmp-store.vercel.app"));
        addDockButton(appIcons, "📁", new Color(240, 180, 40), e -> {});
        addDockButton(appIcons, ">_", new Color(30, 40, 50), e -> openTerminalWindow());
        addDockButton(appIcons, "⚙️", new Color(60, 70, 90), e -> {});
        addDockButton(appIcons, "🎵", new Color(220, 50, 90), e -> {});

        // System Tray (Right)
        JPanel sysTray = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 5));
        sysTray.setOpaque(false);

        JLabel trayStats = new JLabel("⚡ 🔊 🔋 98%");
        trayStats.setFont(new Font("Segoe UI", Font.BOLD, 12));
        trayStats.setForeground(new Color(180, 200, 230));

        clockLabel = new JLabel();
        clockLabel.setFont(new Font("Segoe UI", Font.BOLD, 12));
        clockLabel.setForeground(new Color(0, 242, 255));

        sysTray.add(trayStats);
        sysTray.add(clockLabel);

        dockPanel.add(appIcons, BorderLayout.CENTER);
        dockPanel.add(sysTray, BorderLayout.EAST);
        dockContainer.add(dockPanel);

        add(dockContainer, BorderLayout.SOUTH);

        // Live Clock Timer
        Timer t = new Timer(1000, e -> {
            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a  dd/MM/yy");
            clockLabel.setText(sdf.format(new Date()));
        });
        t.start();
    }

    private void addDockButton(JPanel parent, String text, Color bg, ActionListener action) {
        JButton btn = new JButton(text) {
            @Override
            protected void paintComponent(Graphics g) {
                Graphics2D g2d = (Graphics2D) g.create();
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.setColor(getModel().isRollover() ? bg.brighter() : bg);
                g2d.fillRoundRect(0, 0, getWidth(), getHeight(), 16, 16);
                g2d.dispose();
                super.paintComponent(g);
            }
        };
        btn.setPreferredSize(new Dimension(38, 38));
        btn.setFont(new Font("Segoe UI", Font.BOLD, 13));
        btn.setForeground(Color.WHITE);
        btn.setContentAreaFilled(false);
        btn.setFocusPainted(false);
        btn.setBorderPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addActionListener(action);
        parent.add(btn);
    }

    private void showStartMenu(Component invoker) {
        if (startMenu == null) {
            startMenu = new JPopupMenu();
            startMenu.setBackground(new Color(20, 28, 42));
            addMenuItem("🖥️ Terminal Shell (bash)", e -> openTerminalWindow());
            addMenuItem("🎮 KryloSMP Manager", e -> openServerManagerWindow());
            addMenuItem("📝 project_notes.md", e -> openProjectNotesWindow());
            addMenuItem("📊 System Monitor", e -> openSystemMonitorWindow());
            startMenu.addSeparator();
            addMenuItem("❌ Exit KryloOS", e -> System.exit(0));
        }
        startMenu.show(invoker, 0, -startMenu.getPreferredSize().height);
    }

    private void addMenuItem(String text, ActionListener listener) {
        JMenuItem item = new JMenuItem(text);
        item.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        item.setForeground(Color.WHITE);
        item.setBackground(new Color(20, 28, 42));
        item.addActionListener(listener);
        startMenu.add(item);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // WINDOW 1: Terminal Shell (bash) — TOP LEFT
    // ──────────────────────────────────────────────────────────────────────────
    private void openTerminalWindow() {
        JInternalFrame frame = createCustomWindow("Terminal Shell (bash)", 340, 240);
        frame.setLocation(40, 30);
        frame.setLayout(new BorderLayout());

        JTextArea area = new JTextArea();
        area.setBackground(new Color(12, 16, 24));
        area.setForeground(new Color(0, 242, 255));
        area.setFont(new Font("Consolas", Font.PLAIN, 13));
        area.setMargin(new Insets(10, 10, 10, 10));

        area.append("krylo@v1.0:/# systemctl status smp\n");
        area.append("krylo@v1.0:/# ls -la /etc\n");
        area.append("krylo@v1.0:/# top\n");
        area.append("krylo@v1.0:/# ");

        JTextField field = new JTextField();
        field.setBackground(new Color(18, 24, 36));
        field.setForeground(Color.WHITE);
        field.setFont(new Font("Consolas", Font.PLAIN, 13));

        field.addActionListener(e -> {
            String cmd = field.getText().trim();
            area.append(cmd + "\n");
            field.setText("");
            if (cmd.equalsIgnoreCase("clear")) area.setText("");
            else if (!cmd.isEmpty()) area.append("  Executed: " + cmd + "\n");
            area.append("krylo@v1.0:/# ");
        });

        frame.add(new JScrollPane(area), BorderLayout.CENTER);
        frame.add(field, BorderLayout.SOUTH);
        frame.setVisible(true);
        desktopPane.add(frame);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // WINDOW 2: KryloSMP Server Manager — TOP RIGHT
    // ──────────────────────────────────────────────────────────────────────────
    private void openServerManagerWindow() {
        JInternalFrame frame = createCustomWindow("KryloSMP", 460, 320);
        frame.setLocation(420, 30);
        frame.setLayout(new BorderLayout());

        JPanel body = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                Graphics2D g2d = (Graphics2D) g;
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

                // CPU Graph Draw
                g2d.setColor(new Color(25, 35, 55));
                g2d.fillRoundRect(15, 140, 200, 75, 12, 12);
                g2d.setColor(new Color(0, 242, 255, 120));
                g2d.drawString("CPU Load Graph", 25, 160);

                Path2D path = new Path2D.Double();
                int startX = 25;
                for (int i = 0; i < cpuHistory.length; i++) {
                    int x = startX + i * 5;
                    int y = 200 - (cpuHistory[i] * 35 / 100);
                    if (i == 0) path.moveTo(x, y);
                    else path.lineTo(x, y);
                }
                g2d.setColor(new Color(0, 242, 255));
                g2d.setStroke(new BasicStroke(2));
                g2d.draw(path);

                // Memory Usage Bar Draw
                g2d.setColor(new Color(25, 35, 55));
                g2d.fillRoundRect(230, 140, 200, 75, 12, 12);
                g2d.setColor(new Color(150, 170, 200));
                g2d.drawString("Memory Usage", 240, 160);

                g2d.setColor(new Color(40, 50, 75));
                g2d.fillRect(240, 175, 180, 20);
                g2d.setColor(new Color(100, 80, 220));
                g2d.fillRect(240, 175, 120, 20);
            }
        };
        body.setBackground(new Color(16, 22, 34));
        body.setLayout(null);

        JLabel title = new JLabel("KryloSMP Server Manager");
        title.setFont(new Font("Segoe UI", Font.BOLD, 18));
        title.setForeground(Color.WHITE);
        title.setBounds(15, 10, 300, 30);

        JLabel lblStatus = new JLabel("Status: Running");
        lblStatus.setFont(new Font("Segoe UI", Font.BOLD, 13));
        lblStatus.setForeground(new Color(0, 255, 120));
        lblStatus.setBounds(15, 45, 200, 20);

        JLabel lblNodes = new JLabel("Nodes: 12 Active");
        lblNodes.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lblNodes.setForeground(Color.LIGHT_GRAY);
        lblNodes.setBounds(15, 65, 200, 20);

        JLabel lblUptime = new JLabel("Uptime: 24d 14h");
        lblUptime.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lblUptime.setForeground(Color.LIGHT_GRAY);
        lblUptime.setBounds(15, 85, 200, 20);

        JLabel lblRes = new JLabel("Resources: CPU 68% | RAM 4.2GB / 16GB");
        lblRes.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lblRes.setForeground(Color.LIGHT_GRAY);
        lblRes.setBounds(15, 105, 300, 20);

        // Buttons
        JButton btnWeb = createSmallButton("Web", 15, 230, e -> openWebLink("https://krylosmp-store.vercel.app"));
        JButton btnDB = createSmallButton("DB", 85, 230, e -> {});
        JButton btnAPI = createSmallButton("API", 155, 230, e -> {});

        body.add(title);
        body.add(lblStatus);
        body.add(lblNodes);
        body.add(lblUptime);
        body.add(lblRes);
        body.add(btnWeb);
        body.add(btnDB);
        body.add(btnAPI);

        frame.add(body, BorderLayout.CENTER);
        frame.setVisible(true);
        desktopPane.add(frame);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // WINDOW 3: project_notes.md — BOTTOM LEFT
    // ──────────────────────────────────────────────────────────────────────────
    private void openProjectNotesWindow() {
        JInternalFrame frame = createCustomWindow("project_notes.md", 360, 270);
        frame.setLocation(80, 300);
        frame.setLayout(new BorderLayout());

        JTextArea area = new JTextArea();
        area.setBackground(new Color(14, 18, 28));
        area.setForeground(new Color(200, 215, 235));
        area.setFont(new Font("Consolas", Font.PLAIN, 13));
        area.setMargin(new Insets(10, 10, 10, 10));

        area.append("# KryloOS v1.0 Beta\n\n");
        area.append("## Updates:\n\n");
        area.append("  - Added Terminal\n");
        area.append("  - Improved SMP UI\n");
        area.append("  - Fixed SysMon\n\n");
        area.append("  > Dark Mode\n\n");
        area.append("**Release Notes...");

        frame.add(new JScrollPane(area), BorderLayout.CENTER);
        frame.setVisible(true);
        desktopPane.add(frame);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // WINDOW 4: System Monitor — BOTTOM RIGHT
    // ──────────────────────────────────────────────────────────────────────────
    private void openSystemMonitorWindow() {
        JInternalFrame frame = createCustomWindow("System Monitor", 320, 280);
        frame.setLocation(500, 320);
        frame.setLayout(new BorderLayout());

        JTextArea area = new JTextArea();
        area.setBackground(new Color(14, 18, 28));
        area.setForeground(new Color(0, 242, 255));
        area.setFont(new Font("Consolas", Font.PLAIN, 13));
        area.setMargin(new Insets(10, 10, 10, 10));
        area.setEditable(false);

        area.append("Processes:          148\n");
        area.append("CPU (8 Core):       [62% Load Graph]\n");
        area.append("Memory (16GB):      [4.1GB Used]\n");
        area.append("Disk (512GB):       [210GB Free]\n\n");
        area.append("  KryloOS             148\n");
        area.append("  bash                397\n");
        area.append("  nano                134\n");
        area.append("  smp-manager         176\n");
        area.append("  systemd-journal...   29\n");

        frame.add(new JScrollPane(area), BorderLayout.CENTER);
        frame.setVisible(true);
        desktopPane.add(frame);
    }

    private JInternalFrame createCustomWindow(String title, int width, int height) {
        JInternalFrame frame = new JInternalFrame(title, true, true, true, true);
        frame.setSize(width, height);
        frame.setBorder(BorderFactory.createLineBorder(new Color(0, 242, 255, 80), 1));
        return frame;
    }

    private JButton createSmallButton(String text, int x, int y, ActionListener action) {
        JButton btn = new JButton(text);
        btn.setBounds(x, y, 60, 28);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        btn.setForeground(Color.WHITE);
        btn.setBackground(new Color(0, 120, 220));
        btn.setFocusPainted(false);
        btn.addActionListener(action);
        return btn;
    }

    private void openWebLink(String url) {
        try {
            Desktop.getDesktop().browse(new URI(url));
        } catch (Exception ignored) {}
    }

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        SwingUtilities.invokeLater(() -> {
            KryloOS os = new KryloOS();
            os.setVisible(true);
        });
    }
}
